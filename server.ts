import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// In-memory persistent database for Global Leaderboard
interface LeaderboardRecord {
  id: string;
  playerName: string;
  score: number;
  distanceKm: number;
  timeSec: number;
  routeId: string;
  skinId: string;
  city: string;
  date: string;
}

const leaderboard: LeaderboardRecord[] = [
  { id: '1', playerName: 'Sultana Racer', score: 38500, distanceKm: 34.2, timeSec: 280, routeId: 'endless', skinId: 'tesla', city: 'Dhaka', date: '2026-10-24' },
  { id: '2', playerName: 'CyberJamal', score: 34100, distanceKm: 30.5, timeSec: 295, routeId: 'endless', skinId: 'peacock', city: 'Mirpur', date: '2026-10-24' },
  { id: '3', playerName: 'BananiSpeedster', score: 29800, distanceKm: 26.8, timeSec: 310, routeId: 'endless', skinId: 'redfairy', city: 'Banani', date: '2026-10-23' },
  { id: '4', playerName: 'PuranDhakaKing', score: 27400, distanceKm: 24.1, timeSec: 320, routeId: 'puran', skinId: 'solar', city: 'Puran Dhaka', date: '2026-10-24' },
  { id: '5', playerName: 'MonsoonDrifter', score: 25200, distanceKm: 22.0, timeSec: 335, routeId: 'motijheel', skinId: 'shadow', city: 'Motijheel', date: '2026-10-25' },
  { id: '6', playerName: 'ChittagongExpress', score: 23900, distanceKm: 20.4, timeSec: 350, routeId: 'farmgate', skinId: 'tesla', city: 'Chittagong', date: '2026-10-24' },
  { id: '7', playerName: 'SylhetTurbo', score: 21500, distanceKm: 18.2, timeSec: 370, routeId: 'dhanmondi', skinId: 'peacock', city: 'Sylhet', date: '2026-10-25' },
  { id: '8', playerName: 'TeslaRickshaw_007', score: 19800, distanceKm: 16.9, timeSec: 390, routeId: 'gulshan', skinId: 'solar', city: 'Gulshan', date: '2026-10-24' },
];

// Daily Quests definition
const initialDailyQuests = [
  {
    id: 'quest_bell',
    title: 'Dhaka Bellmaster',
    titleBn: 'ঢাকা ঘণ্টি ওস্তাদ',
    description: 'Ring bell 15 times to alert traffic & pedestrians',
    descriptionBn: 'পথচারী ও গাড়িকে সতর্ক করতে ১৫ বার ঘণ্টি বাজান',
    rewardCoins: 250,
    rewardXp: 150,
    target: 15,
    current: 0,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_draft',
    title: 'Bus Slipstreamer',
    titleBn: 'বাসের পেছনে ড্রাফটিং',
    description: 'Draft behind Dhaka buses for 10 seconds total',
    descriptionBn: 'বাসের পেছনে স্লিপস্ট্রিম ড্রাফট করে ১০ সেকেন্ড চালান',
    rewardCoins: 400,
    rewardXp: 250,
    target: 10,
    current: 0,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_coins',
    title: 'Taka Collector',
    titleBn: 'টাকা সংগ্রহকারী',
    description: 'Gather 80 Taka coins in traffic',
    descriptionBn: 'রাস্তা থেকে ৮০ টাকার কয়েন সংগ্রহ করুন',
    rewardCoins: 300,
    rewardXp: 200,
    target: 80,
    current: 0,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_regen',
    title: 'Clean Energy Master',
    titleBn: 'গ্রিন এনার্জি রিচার্জ',
    description: 'Recover 30% battery via regenerative braking',
    descriptionBn: 'রিজেনারেটিভ ব্রেকিং দিয়ে ৩০% ব্যাটারি রিচার্জ করুন',
    rewardCoins: 350,
    rewardXp: 200,
    target: 30,
    current: 0,
    completed: false,
    claimed: false,
  },
];

// Daily Login Calendar (7-day cycle)
const dailyCalendar = [
  { day: 1, label: 'Day 1', coins: 150, bonus: '50 Energy', claimed: true },
  { day: 2, label: 'Day 2', coins: 250, bonus: 'Double Turbo x2', claimed: false },
  { day: 3, label: 'Day 3', coins: 400, bonus: 'Chrome Bell Tone', claimed: false },
  { day: 4, label: 'Day 4', coins: 550, bonus: 'LFP Battery Booster', claimed: false },
  { day: 5, label: 'Day 5', coins: 700, bonus: 'Red Fairy Skin Discount', claimed: false },
  { day: 6, label: 'Day 6', coins: 1000, bonus: 'Dual Sonic Horn', claimed: false },
  { day: 7, label: 'Day 7', coins: 2000, bonus: 'Exclusive "Solar Apex" Skin', claimed: false, skinUnlock: 'solar' },
];

// Leaderboard API
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const routeId = req.query.route as string;
  let filtered = [...leaderboard];

  if (routeId && routeId !== 'all') {
    filtered = filtered.filter((r) => r.routeId === routeId);
  }

  // Sort descending by score
  filtered.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: filtered.slice(0, 30),
    totalCount: filtered.length,
  });
});

app.post('/api/leaderboard', (req: Request, res: Response) => {
  const { playerName, score, distanceKm, timeSec, routeId, skinId, city } = req.body;

  if (!playerName || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score payload' });
  }

  const newEntry: LeaderboardRecord = {
    id: String(Date.now()),
    playerName: String(playerName).slice(0, 24),
    score: Math.max(0, Math.floor(score)),
    distanceKm: parseFloat(Number(distanceKm || 0).toFixed(2)),
    timeSec: Math.floor(timeSec || 0),
    routeId: routeId || 'endless',
    skinId: skinId || 'tesla',
    city: city || 'Dhaka',
    date: new Date().toISOString().slice(0, 10),
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.score - a.score);

  const rank = leaderboard.findIndex((e) => e.id === newEntry.id) + 1;

  res.json({
    success: true,
    rank,
    entry: newEntry,
  });
});

// Challenges & Daily Rewards API
app.get('/api/challenges', (_req: Request, res: Response) => {
  res.json({
    success: true,
    season: {
      id: 'season_1',
      name: 'Season 1: Dhaka Cyber Monsoon',
      nameBn: 'সিজন ১: ঢাকা সাইবার মনসুন',
      daysLeft: 26,
      currentXp: 1450,
      currentTier: 4,
      maxTier: 10,
    },
    dailyRewards: dailyCalendar,
    quests: initialDailyQuests,
  });
});

app.post('/api/challenges/claim', (req: Request, res: Response) => {
  const { type, id } = req.body;

  if (type === 'daily_reward') {
    const day = Number(id);
    const item = dailyCalendar.find((d) => d.day === day);
    if (item) item.claimed = true;
    return res.json({ success: true, claimedDay: day, reward: item });
  }

  if (type === 'quest') {
    const quest = initialDailyQuests.find((q) => q.id === id);
    if (quest) {
      quest.claimed = true;
      return res.json({ success: true, quest });
    }
  }

  res.json({ success: true });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// -------------------------------------------------------------
// HTTP & WEBSOCKET MULTIPLAYER SERVER
// -------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface RoomPlayer {
  ws: WebSocket;
  id: string;
  name: string;
  skinId: string;
  x: number;
  lane: number;
  speed: number;
  battery: number;
  isBoosting: boolean;
  isBraking: boolean;
  bellRung: boolean;
  finished: boolean;
  finishTime?: number;
}

interface GameRoom {
  code: string;
  hostId: string;
  routeId: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  players: Map<string, RoomPlayer>;
  startTime?: number;
}

const rooms = new Map<string, GameRoom>();

function broadcastRoom(room: GameRoom, eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, ...payload });
  room.players.forEach((p) => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  });
}

function getRoomSnapshot(room: GameRoom) {
  const playersList: any[] = [];
  room.players.forEach((p) => {
    playersList.push({
      id: p.id,
      name: p.name,
      skinId: p.skinId,
      x: p.x,
      lane: p.lane,
      speed: p.speed,
      battery: p.battery,
      isBoosting: p.isBoosting,
      isBraking: p.isBraking,
      bellRung: p.bellRung,
      finished: p.finished,
      finishTime: p.finishTime,
    });
  });

  return {
    code: room.code,
    hostId: room.hostId,
    routeId: room.routeId,
    status: room.status,
    players: playersList,
  };
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      // 1. CREATE ROOM
      if (msg.type === 'create_room') {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const pid = String(msg.playerId || 'player_' + Math.random().toString(36).substring(2, 7));
        playerId = pid;
        currentRoomCode = roomCode;

        const room: GameRoom = {
          code: roomCode,
          hostId: pid,
          routeId: msg.routeId || 'farmgate',
          status: 'waiting',
          players: new Map(),
        };

        const player: RoomPlayer = {
          ws,
          id: pid,
          name: msg.playerName || 'Racer ' + roomCode,
          skinId: msg.skinId || 'tesla',
          x: 0,
          lane: 1,
          speed: 0,
          battery: 100,
          isBoosting: false,
          isBraking: false,
          bellRung: false,
          finished: false,
        };

        room.players.set(pid, player);
        rooms.set(roomCode, room);

        ws.send(JSON.stringify({ type: 'room_created', room: getRoomSnapshot(room) }));
      }

      // 2. JOIN ROOM
      else if (msg.type === 'join_room') {
        const roomCode = String(msg.roomCode || '').toUpperCase();
        const room = rooms.get(roomCode);

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          return;
        }

        if (room.players.size >= 4) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 4)' }));
          return;
        }

        const pid = String(msg.playerId || 'player_' + Math.random().toString(36).substring(2, 7));
        playerId = pid;
        currentRoomCode = roomCode;

        const player: RoomPlayer = {
          ws,
          id: pid,
          name: msg.playerName || 'Racer',
          skinId: msg.skinId || 'peacock',
          x: 0,
          lane: room.players.size % 3,
          speed: 0,
          battery: 100,
          isBoosting: false,
          isBraking: false,
          bellRung: false,
          finished: false,
        };

        room.players.set(pid, player);

        broadcastRoom(room, 'room_updated', { room: getRoomSnapshot(room) });
      }

      // 3. START RACE (Host only)
      else if (msg.type === 'start_race') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== playerId) return;

        room.status = 'countdown';
        broadcastRoom(room, 'countdown_start', { count: 3 });

        setTimeout(() => {
          room.status = 'racing';
          room.startTime = Date.now();
          broadcastRoom(room, 'race_start', { startTime: room.startTime });
        }, 3000);
      }

      // 4. REAL-TIME PLAYER STATE SYNC
      else if (msg.type === 'sync_state') {
        if (!currentRoomCode || !playerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const player = room.players.get(playerId);
        if (!player) return;

        player.x = msg.x ?? player.x;
        player.lane = msg.lane ?? player.lane;
        player.speed = msg.speed ?? player.speed;
        player.battery = msg.battery ?? player.battery;
        player.isBoosting = !!msg.isBoosting;
        player.isBraking = !!msg.isBraking;
        player.bellRung = !!msg.bellRung;

        // Broadcast to other room members
        room.players.forEach((p) => {
          if (p.id !== playerId && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({
              type: 'player_update',
              playerId,
              state: {
                x: player.x,
                lane: player.lane,
                speed: player.speed,
                battery: player.battery,
                isBoosting: player.isBoosting,
                isBraking: player.isBraking,
                bellRung: player.bellRung,
              },
            }));
          }
        });
      }

      // 5. PLAYER BELL TAUNT
      else if (msg.type === 'taunt_bell') {
        if (!currentRoomCode || !playerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        broadcastRoom(room, 'player_bell', { playerId, text: 'ট্রিং ট্রিং! 🔔' });
      }

      // 6. FINISH LINE
      else if (msg.type === 'player_finished') {
        if (!currentRoomCode || !playerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;

        const player = room.players.get(playerId);
        if (player) {
          player.finished = true;
          player.finishTime = msg.timeSec;
          broadcastRoom(room, 'player_finish', { playerId, name: player.name, timeSec: msg.timeSec });
        }
      }
    } catch {
      // safe message error handling
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && playerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(currentRoomCode);
        } else {
          if (room.hostId === playerId) {
            // Assign next player as host
            room.hostId = room.players.keys().next().value || '';
          }
          broadcastRoom(room, 'room_updated', { room: getRoomSnapshot(room) });
        }
      }
    }
  });
});

// Mount Vite or Serve Static Frontend
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Bangla Tesla server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
