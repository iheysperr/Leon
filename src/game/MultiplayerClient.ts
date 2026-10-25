/**
 * WebSocket Multiplayer Client for Bangla Tesla
 * Connects to the Express/Node WebSocket server for real-time race synchronization.
 */

export interface MultiplayerCallbacks {
  onRoomCreated?: (room: any) => void;
  onRoomUpdated?: (room: any) => void;
  onRaceStart?: (startTime: number) => void;
  onCountdownStart?: (count: number) => void;
  onPlayerUpdate?: (playerId: string, state: any) => void;
  onPlayerBell?: (playerId: string, text: string) => void;
  onPlayerFinish?: (playerId: string, name: string, timeSec: number) => void;
  onError?: (message: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string;
  private callbacks: MultiplayerCallbacks = {};
  public isConnected: boolean = false;

  constructor(callbacks: MultiplayerCallbacks = {}) {
    this.callbacks = callbacks;
    this.playerId = 'player_' + Math.random().toString(36).substring(2, 8);
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          resolve(true);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
        };

        this.ws.onerror = () => {
          this.isConnected = false;
          resolve(false);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch {
            // safe json parse
          }
        };
      } catch {
        resolve(false);
      }
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'room_created':
        this.callbacks.onRoomCreated?.(data.room);
        break;
      case 'room_updated':
        this.callbacks.onRoomUpdated?.(data.room);
        break;
      case 'countdown_start':
        this.callbacks.onCountdownStart?.(data.count);
        break;
      case 'race_start':
        this.callbacks.onRaceStart?.(data.startTime);
        break;
      case 'player_update':
        this.callbacks.onPlayerUpdate?.(data.playerId, data.state);
        break;
      case 'player_bell':
        this.callbacks.onPlayerBell?.(data.playerId, data.text);
        break;
      case 'player_finish':
        this.callbacks.onPlayerFinish?.(data.playerId, data.name, data.timeSec);
        break;
      case 'error':
        this.callbacks.onError?.(data.message);
        break;
    }
  }

  public setCallbacks(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  public createRoom(playerName: string, routeId: string, skinId: string = 'tesla') {
    this.send({
      type: 'create_room',
      playerId: this.playerId,
      playerName,
      routeId,
      skinId,
    });
  }

  public joinRoom(playerName: string, roomCode: string, skinId: string = 'tesla') {
    this.send({
      type: 'join_room',
      playerId: this.playerId,
      playerName,
      roomCode,
      skinId,
    });
  }

  public startRace() {
    this.send({ type: 'start_race' });
  }

  public syncState(state: {
    x: number;
    lane: number;
    speed: number;
    battery: number;
    isBoosting: boolean;
    isBraking: boolean;
    bellRung: boolean;
  }) {
    this.send({
      type: 'sync_state',
      ...state,
    });
  }

  public sendBellTaunt() {
    this.send({ type: 'taunt_bell' });
  }

  public sendFinished(timeSec: number) {
    this.send({ type: 'player_finished', timeSec });
  }

  private send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
