export type WeatherType = 'day' | 'sunset' | 'night' | 'rain' | 'fog';

export interface DynamicWeatherState {
  current: WeatherType;
  base: WeatherType;
  intensity: number; // 0.0 to 1.0
  visibility: number; // 0.35 (dense fog/storm) to 1.0 (clear)
  traction: number; // 0.6 (slick wet) to 1.0 (dry grip)
  windSpeed: number; // -100 to +100 px/s wind drift
  fogDensity: number; // 0.0 to 1.0
  rainIntensity: number; // 0.0 to 1.0
  name: string;
  nameBn: string;
  alertText?: string;
  alertTextBn?: string;
}

export interface RouteConfig {
  id: string;
  name: string;
  nameBn: string;
  from: string;
  to: string;
  km: number;
  trafficDensity: number;
  weather: WeatherType;
  rivalSpeed: number;
  description: string;
  descriptionBn: string;
  potholeFrequency: number;
  monsoonFlooded?: boolean;
}

export interface RickshawSkin {
  id: string;
  name: string;
  nameBn: string;
  bodyColor: string;
  accentColor: string;
  glowColor: string;
  hoodPattern: 'cyber' | 'peacock' | 'racing' | 'solar' | 'gold';
  hoodArtText?: string;
  neonUnderglow: boolean;
  unlockedByDefault: boolean;
  requiredTier?: number;
}

export interface PlayerUpgrades {
  motorLevel: number; // 0..5 (affects acceleration and top speed)
  batteryLevel: number; // 0..5 (affects max battery and discharge rate)
  regenLevel: number; // 0..5 (affects regenerative braking charge rate)
  bellLevel: number; // 0..5 (affects bell radius and obstacle stun/clear time)
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  distanceKm: number;
  timeSec: number;
  routeId: string;
  skinId: string;
  city: string;
  date: string;
  isPlayer?: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  rewardCoins: number;
  rewardXp: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyReward {
  day: number;
  label: string;
  coins: number;
  bonus: string;
  claimed: boolean;
  skinUnlock?: string;
}

export interface MultiplayerPlayerState {
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
  ping?: number;
}

export interface MultiplayerRoom {
  code: string;
  hostId: string;
  routeId: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  players: Record<string, MultiplayerPlayerState>;
  startTime?: number;
}

export interface GhostFrame {
  t: number; // seconds from race start
  x: number;
  y: number;
  speed: number;
  lane: number;
  leanAngle: number;
  isBoosting: boolean;
  isBraking: boolean;
  bellRung: boolean;
}

export interface RouteGhostData {
  routeId: string;
  totalTime: number;
  distanceKm: number;
  score: number;
  skinId: string;
  recordedAt: string;
  frames: GhostFrame[];
}

export interface GhostComparison {
  deltaDistanceMeters: number; // positive = player ahead, negative = ghost ahead
  deltaTimeSec: number; // approximate lead time (+ ahead, - behind)
  ghostX: number;
  ghostY: number;
  ghostSpeed: number;
  hasGhost: boolean;
}
