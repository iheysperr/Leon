/**
 * Bangla Tesla Core Physics & Game Engine
 * 60fps simulation loop with EV motor torque, regenerative braking,
 * aerodynamic slipstream drafting, spring suspension, dynamic traffic AI,
 * and dynamic weather (Dhaka monsoon rain, fog/smog, traction and visibility impact).
 */

import { DynamicWeatherState, GhostComparison, PlayerUpgrades, RickshawSkin, RouteConfig, WeatherType } from '../types/game';
import { sound } from './AudioSynthesizer';
import { GhostManager } from './GhostManager';
import { RickshawArt, SKINS } from './RickshawArt';
import { ROAD_LANES, Scenery } from './Scenery';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  kind?: 'dot' | 'spark' | 'plasma';
}

export interface BoostTrailNode {
  x: number;
  y: number;
  leanAngle: number;
  time: number;
  color: string;
}

export interface BoostShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  duration: number;
  elapsed: number;
}

export interface SpeedStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
  color: string;
}

export interface TrafficEntity {
  id: number;
  kind: 'car' | 'bus' | 'cng' | 'person' | 'pothole' | 'puddle' | 'coin' | 'battery' | 'boost' | 'tea' | 'rival';
  x: number;
  lane: number;
  y: number;
  vx: number;
  color?: string;
  hasUmbrella?: boolean;
  collected?: boolean;
  busColor?: string;
  rivalSkin?: RickshawSkin;
  rivalName?: string;
  scared?: boolean; // Pedestrian scared by bell
}

export interface GameOverResult {
  win: boolean;
  timeSec: number;
  distanceKm: number;
  coins: number;
  score: number;
  isNewRecord?: boolean;
  timeSavedSec?: number;
  previousBestTime?: number;
}

export interface GameEngineEvents {
  onScoreUpdate: (score: number, coins: number, distanceKm: number) => void;
  onBatteryUpdate: (batteryPercent: number, isRegen: boolean) => void;
  onSpeedUpdate: (speedKmh: number) => void;
  onDraftingUpdate: (isDrafting: boolean) => void;
  onGameOver: (result: GameOverResult) => void;
  onBellTriggered: () => void;
  onWeatherUpdate?: (weather: DynamicWeatherState) => void;
  onGhostUpdate?: (comparison: GhostComparison) => void;
}

export class GameEngine {
  private scenery: Scenery;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public route: RouteConfig;
  public skin: RickshawSkin;
  public upgrades: PlayerUpgrades;
  public events: GameEngineEvents;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  // Player physics state
  public heroX: number = 0;
  public heroLane: number = 1;
  public targetLane: number = 1;
  public heroY: number = ROAD_LANES[1];
  public heroSpeed: number = 0; // px/s
  public heroBattery: number = 100; // 0..100 %
  public heroLeanAngle: number = 0;
  public heroSuspensionY: number = 0;
  private suspensionVy: number = 0;
  private wheelAngle: number = 0;

  // Dynamic Weather Simulation State
  public weatherState: DynamicWeatherState = {
    current: 'day',
    base: 'day',
    intensity: 0.0,
    visibility: 1.0,
    traction: 1.0,
    windSpeed: 0,
    fogDensity: 0.0,
    rainIntensity: 0.0,
    name: 'Clear Day',
    nameBn: 'পরিষ্কার দিন',
  };
  private weatherPhaseTimer: number = 22; // Seconds until next periodic atmospheric change
  private targetWeatherState: Partial<DynamicWeatherState> | null = null;

  // Timers & Cooldowns
  public boostTimeLeft: number = 0;
  public boostCooldown: number = 0;
  public bellCooldown: number = 0;
  private hitstopTimer: number = 0;
  public screenShake: number = 0;
  public isDrafting: boolean = false;
  public isRegenerating: boolean = false;

  public ghostManager = new GhostManager();

  // Score & Stats
  public coins: number = 0;
  public score: number = 0;
  public elapsedTimeSec: number = 0;
  public bellsRungCount: number = 0;
  public draftingSeconds: number = 0;

  // Input states
  public input = {
    throttle: false,
    brake: false,
    left: false,
    right: false,
    boost: false,
    bell: false,
  };

  // World objects
  public traffic: TrafficEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  private nextEntityId: number = 1;
  private nextSpawnX: number = 600;

  // Visual Boost Trail & Speed VFX
  public boostTrailNodes: BoostTrailNode[] = [];
  public boostShockwaves: BoostShockwave[] = [];
  public speedStreaks: SpeedStreak[] = [];
  private lastTrailSampleX: number = 0;
  private shockwaveTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    route: RouteConfig,
    skin: RickshawSkin,
    upgrades: PlayerUpgrades,
    events: GameEngineEvents
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.route = route;
    this.skin = skin;
    this.upgrades = upgrades;
    this.events = events;
    this.scenery = new Scenery();

    this.resetState();
  }

  public resetState() {
    this.heroX = 0;
    this.heroLane = 1;
    this.targetLane = 1;
    this.heroY = ROAD_LANES[1];
    this.heroSpeed = 0;
    this.heroBattery = 100;
    this.heroLeanAngle = 0;
    this.heroSuspensionY = 0;
    this.suspensionVy = 0;
    this.wheelAngle = 0;

    this.boostTimeLeft = 0;
    this.boostCooldown = 0;
    this.bellCooldown = 0;
    this.hitstopTimer = 0;
    this.screenShake = 0;
    this.isDrafting = false;
    this.isRegenerating = false;

    this.coins = 0;
    this.score = 0;
    this.elapsedTimeSec = 0;
    this.bellsRungCount = 0;
    this.draftingSeconds = 0;

    this.traffic = [];
    this.particles = [];
    this.floatingTexts = [];
    this.boostTrailNodes = [];
    this.boostShockwaves = [];
    this.speedStreaks = [];
    this.lastTrailSampleX = 0;
    this.shockwaveTimer = 0;
    this.nextSpawnX = 700;

    // Load personal record shadow and start telemetry recording
    this.ghostManager.loadGhostForRoute(this.route.id, this.route.km);
    this.ghostManager.startRecording();

    // Initialize dynamic weather based on route
    const baseW = this.route.weather || 'day';
    this.weatherState = {
      current: baseW,
      base: baseW,
      intensity: baseW === 'rain' ? 0.75 : 0.0,
      visibility: baseW === 'rain' ? 0.75 : baseW === 'fog' ? 0.45 : 1.0,
      traction: baseW === 'rain' ? 0.65 : baseW === 'fog' ? 0.85 : 1.0,
      windSpeed: baseW === 'rain' ? 35 : 0,
      fogDensity: baseW === 'fog' ? 0.8 : 0.0,
      rainIntensity: baseW === 'rain' ? 0.75 : 0.0,
      name: baseW === 'rain' ? 'Monsoon Rain' : baseW === 'fog' ? 'Winter Fog' : baseW === 'sunset' ? 'Sunset' : baseW === 'night' ? 'Cyber Night' : 'Clear Day',
      nameBn: baseW === 'rain' ? 'বর্ষার বৃষ্টি' : baseW === 'fog' ? 'শীতের কুয়াশা' : baseW === 'sunset' ? 'গোধূলি লগ্ন' : baseW === 'night' ? 'সাইবার রাত' : 'পরিষ্কার দিন',
    };

    this.targetWeatherState = { ...this.weatherState };
    this.weatherPhaseTimer = 22;

    // Spawn 2 initial rival rickshaws
    this.traffic.push({
      id: this.nextEntityId++,
      kind: 'rival',
      x: 350,
      lane: 0,
      y: ROAD_LANES[0],
      vx: 380,
      rivalSkin: SKINS.peacock,
      rivalName: 'ময়ূরপঙ্খী',
    });
    this.traffic.push({
      id: this.nextEntityId++,
      kind: 'rival',
      x: 250,
      lane: 2,
      y: ROAD_LANES[2],
      vx: 410,
      rivalSkin: SKINS.redfairy,
      rivalName: 'লাল পরী',
    });
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    sound.startMotor();
    this.loop(this.lastTimestamp);
  }

  public pause() {
    this.isPaused = true;
    sound.stopMotor();
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    sound.startMotor();
    this.loop(this.lastTimestamp);
  }

  public toggleGhostMode(): boolean {
    return this.ghostManager.toggleGhost();
  }

  public isGhostModeEnabled(): boolean {
    return this.ghostManager.isGhostEnabled;
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    sound.stopMotor();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Clamp dt for 60fps simulation stability
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      this.update(dt);
      this.render();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Action: Ring the Bell ("ট্রিং ট্রিং!")
   */
  public triggerBell() {
    if (this.bellCooldown > 0) return;
    this.bellCooldown = Math.max(0.6, 1.4 - this.upgrades.bellLevel * 0.15);
    this.bellsRungCount++;
    sound.playBell();

    this.addFloatingText('ট্রিং ট্রিং! 🔔', this.heroX + 40, this.heroY - 45, '#ffd23f');
    this.events.onBellTriggered();

    // Record ghost telemetry with bell event
    this.ghostManager.recordSample(
      this.elapsedTimeSec,
      this.heroX,
      this.heroY,
      this.heroSpeed,
      this.heroLane,
      this.heroLeanAngle,
      this.boostTimeLeft > 0,
      this.input.brake,
      true
    );

    // Bell effect on nearby traffic:
    // Pedestrians clear to side; CNGs move out of the lane
    const bellRadius = 380 + this.upgrades.bellLevel * 70;
    for (const entity of this.traffic) {
      const dist = Math.hypot(entity.x - this.heroX, entity.y - this.heroY);
      if (dist < bellRadius && entity.x > this.heroX) {
        if (entity.kind === 'person') {
          entity.scared = true;
          // Pedestrian jumps away towards road curb
          entity.y -= 40;
          this.addFloatingText('ছুটুন! 🏃', entity.x, entity.y - 20, '#ffffff');
        } else if (entity.kind === 'cng' && entity.lane === this.heroLane) {
          // CNG yields lane
          const altLane = entity.lane === 0 ? 1 : entity.lane === 2 ? 1 : 0;
          entity.lane = altLane;
          entity.y = ROAD_LANES[altLane];
          this.addFloatingText('সাইড দিলাম! 🚕', entity.x, entity.y - 20, '#00e5ff');
        }
      }
    }
  }

  /**
   * Action: Turbo Nitro Boost
   */
  public triggerBoost() {
    if (this.boostTimeLeft > 0 || this.boostCooldown > 0) return;
    if (this.heroBattery < 10) {
      this.addFloatingText('কম ব্যাটারি! ⚠️', this.heroX, this.heroY - 40, '#ff7675');
      return;
    }

    this.boostTimeLeft = 2.4;
    this.boostCooldown = 5.0;
    this.heroBattery = Math.max(0, this.heroBattery - 12);
    sound.playBoost();
    this.screenShake = 10;
    this.addFloatingText('⚡ TURBO BOOST!', this.heroX + 20, this.heroY - 50, '#00f2fe');

    // Initial sonic compression shockwave expanding from thruster nozzle
    this.boostShockwaves.push({
      x: this.heroX - 42,
      y: this.heroY + this.heroSuspensionY,
      radius: 8,
      maxRadius: 75,
      alpha: 1.0,
      color: '#00f2fe',
      duration: 0.42,
      elapsed: 0,
    });

    // Seed first trail node
    this.lastTrailSampleX = this.heroX;
    this.boostTrailNodes.push({
      x: this.heroX - 42,
      y: this.heroY + this.heroSuspensionY,
      leanAngle: this.heroLeanAngle,
      time: this.elapsedTimeSec,
      color: this.skin.glowColor || '#00f2fe',
    });

    // Spawn high-velocity burst sparks shooting backwards
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: this.heroX - 42,
        y: this.heroY + this.heroSuspensionY + (Math.random() * 20 - 10),
        vx: -350 - Math.random() * 450,
        vy: (Math.random() - 0.5) * 110,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? '#00f2fe' : (Math.random() > 0.5 ? '#ff007f' : '#ffffff'),
        alpha: 1.0,
        life: 0.35 + Math.random() * 0.35,
        kind: 'spark',
      });
    }
  }

  /**
   * Lane change request
   */
  public switchLane(direction: 'up' | 'down') {
    if (direction === 'up' && this.targetLane > 0) {
      this.targetLane--;
    } else if (direction === 'down' && this.targetLane < 2) {
      this.targetLane++;
    }
  }

  /**
   * Manually cycle dynamic weather condition
   */
  public cycleWeather() {
    const cycle: WeatherType[] = ['day', 'sunset', 'night', 'rain', 'fog'];
    const nextIdx = (cycle.indexOf(this.weatherState.current) + 1) % cycle.length;
    this.setTargetWeather(cycle[nextIdx]);
  }

  public setTargetWeather(type: WeatherType) {
    if (type === 'rain') {
      this.targetWeatherState = {
        rainIntensity: 0.9,
        fogDensity: 0.1,
        visibility: 0.7,
        traction: 0.62,
        windSpeed: 45,
      };
      this.addFloatingText('🌧️ মেঘভাঙা বর্ষা শুরু!', this.heroX + 120, this.heroY - 55, '#4cc3ff');
      sound.playThunder();
    } else if (type === 'fog') {
      this.targetWeatherState = {
        rainIntensity: 0.0,
        fogDensity: 0.85,
        visibility: 0.38,
        traction: 0.85,
        windSpeed: 10,
      };
      this.addFloatingText('🌫️ ঢাকা কুয়াশা সতর্কতা!', this.heroX + 120, this.heroY - 55, '#cbbbe8');
      sound.playFogHorn();
    } else if (type === 'sunset') {
      this.targetWeatherState = {
        rainIntensity: 0.0,
        fogDensity: 0.0,
        visibility: 0.95,
        traction: 1.0,
        windSpeed: 5,
      };
      this.weatherState.base = 'sunset';
    } else if (type === 'night') {
      this.targetWeatherState = {
        rainIntensity: 0.0,
        fogDensity: 0.0,
        visibility: 0.88,
        traction: 1.0,
        windSpeed: 0,
      };
      this.weatherState.base = 'night';
    } else {
      // Day
      this.targetWeatherState = {
        rainIntensity: 0.0,
        fogDensity: 0.0,
        visibility: 1.0,
        traction: 1.0,
        windSpeed: 0,
      };
      this.weatherState.base = 'day';
    }
  }

  private updateWeather(dt: number) {
    this.weatherPhaseTimer -= dt;

    // Periodically shift weather or trigger dynamic Dhaka events
    if (this.weatherPhaseTimer <= 0) {
      this.weatherPhaseTimer = 25 + Math.random() * 20;
      this.triggerPeriodicWeatherShift();
    }

    // Smooth transition lerp towards target parameters
    const lerpSpeed = dt * 0.45;
    if (this.targetWeatherState) {
      if (this.targetWeatherState.visibility != null) {
        this.weatherState.visibility += (this.targetWeatherState.visibility - this.weatherState.visibility) * lerpSpeed;
      }
      if (this.targetWeatherState.traction != null) {
        this.weatherState.traction += (this.targetWeatherState.traction - this.weatherState.traction) * lerpSpeed;
      }
      if (this.targetWeatherState.fogDensity != null) {
        this.weatherState.fogDensity += (this.targetWeatherState.fogDensity - this.weatherState.fogDensity) * lerpSpeed;
      }
      if (this.targetWeatherState.rainIntensity != null) {
        this.weatherState.rainIntensity += (this.targetWeatherState.rainIntensity - this.weatherState.rainIntensity) * lerpSpeed;
      }
      if (this.targetWeatherState.windSpeed != null) {
        this.weatherState.windSpeed += (this.targetWeatherState.windSpeed - this.weatherState.windSpeed) * lerpSpeed;
      }
    }

    // Sync dominant weather label
    if (this.weatherState.fogDensity > 0.45 && this.weatherState.rainIntensity < 0.3) {
      this.weatherState.current = 'fog';
      this.weatherState.name = 'Winter Fog';
      this.weatherState.nameBn = 'শীতের কুয়াশা';
    } else if (this.weatherState.rainIntensity > 0.3) {
      this.weatherState.current = 'rain';
      this.weatherState.name = this.weatherState.rainIntensity > 0.7 ? 'Monsoon Cloudburst' : 'Monsoon Rain';
      this.weatherState.nameBn = this.weatherState.rainIntensity > 0.7 ? 'মেঘভাঙা বর্ষা' : 'বর্ষার বৃষ্টি';
    } else {
      this.weatherState.current = this.weatherState.base;
      this.weatherState.name =
        this.weatherState.base === 'sunset'
          ? 'Sunset'
          : this.weatherState.base === 'night'
          ? 'Cyber Night'
          : 'Clear Day';
      this.weatherState.nameBn =
        this.weatherState.base === 'sunset'
          ? 'গোধূলি লগ্ন'
          : this.weatherState.base === 'night'
          ? 'সাইবার রাত'
          : 'পরিষ্কার দিন';
    }

    this.events.onWeatherUpdate?.(this.weatherState);
  }

  private triggerPeriodicWeatherShift() {
    const isCurrentlyAdverse = this.weatherState.fogDensity > 0.35 || this.weatherState.rainIntensity > 0.35;

    if (isCurrentlyAdverse && Math.random() < 0.65) {
      // Clear up
      this.targetWeatherState = {
        rainIntensity: 0.0,
        fogDensity: 0.0,
        visibility: 1.0,
        traction: 1.0,
        windSpeed: 0,
      };
      this.addFloatingText('☀️ আকাশ পরিষ্কার হচ্ছে / Sky Clearing', this.heroX + 100, this.heroY - 50, '#ffd23f');
    } else {
      // Roll random adverse condition: Monsoon Rain or Winter Fog
      if (Math.random() < 0.5) {
        this.setTargetWeather('rain');
      } else {
        this.setTargetWeather('fog');
      }
    }
  }

  private update(dt: number) {
    // Hitstop freeze frame on collision
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    this.elapsedTimeSec += dt;

    // Cooldown decrements
    if (this.boostCooldown > 0) this.boostCooldown = Math.max(0, this.boostCooldown - dt);
    if (this.boostTimeLeft > 0) this.boostTimeLeft = Math.max(0, this.boostTimeLeft - dt);
    if (this.bellCooldown > 0) this.bellCooldown = Math.max(0, this.bellCooldown - dt);
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 18);

    // -------------------------------------------------------------
    // 0. DYNAMIC WEATHER SIMULATION & HANDLING IMPACT
    // -------------------------------------------------------------
    this.updateWeather(dt);
    const traction = this.weatherState.traction;

    // -------------------------------------------------------------
    // 1. VEHICLE DYNAMICS & EV MOTOR TORQUE (Impacted by Weather)
    // -------------------------------------------------------------
    const isFlatBattery = this.heroBattery <= 0;
    const motorBonus = 1 + this.upgrades.motorLevel * 0.12;

    // Max speeds
    const normalTopSpeed = (isFlatBattery ? 240 : 540) * motorBonus;
    const boostTopSpeed = 820 * motorBonus;
    const currentMaxSpeed = this.boostTimeLeft > 0 ? boostTopSpeed : normalTopSpeed;

    // Acceleration & Braking with Traction scaling
    const accelRate = (this.boostTimeLeft > 0 ? 700 : isFlatBattery ? 180 : 420) * motorBonus;
    const naturalFriction = 120 * (1.2 - traction * 0.2); // slight rolling resistance

    // Braking is noticeably affected by wet road traction
    const effectiveBrakeDecel = 650 * (0.45 + traction * 0.55);

    let targetThrottle = this.input.throttle;
    if (this.boostTimeLeft > 0) targetThrottle = true;

    if (this.input.brake) {
      // Regenerative Braking with wet surface slipping
      this.heroSpeed = Math.max(0, this.heroSpeed - effectiveBrakeDecel * dt);
      this.isRegenerating = this.heroSpeed > 100;
      if (this.isRegenerating) {
        const regenEfficiency = 0.8 + this.upgrades.regenLevel * 0.6;
        this.heroBattery = Math.min(100, this.heroBattery + regenEfficiency * dt * 3.5);
        if (Math.random() < 0.1) {
          sound.playRegenHum();
        }
      }
    } else if (targetThrottle) {
      this.isRegenerating = false;
      this.heroSpeed = Math.min(currentMaxSpeed, this.heroSpeed + accelRate * dt);

      // Low-traction wheel slip when accelerating on flooded asphalt
      if (traction < 0.75 && this.heroSpeed < 180 && Math.random() < 0.3) {
        this.particles.push({
          x: this.heroX - 25,
          y: this.heroY + 8,
          vx: -130 - Math.random() * 80,
          vy: -15 - Math.random() * 30,
          size: 2.5,
          color: 'rgba(180, 220, 255, 0.75)',
          alpha: 0.8,
          life: 0.25,
        });
      }
    } else {
      this.isRegenerating = false;
      // Coasting deceleration
      this.heroSpeed = Math.max(0, this.heroSpeed - naturalFriction * dt);
    }

    // Aerodynamic drafting behind large vehicles
    this.checkSlipstreamDrafting(dt);

    // Battery consumption while driving
    if (targetThrottle && !isFlatBattery && this.heroSpeed > 50) {
      const batteryDrainMult = Math.max(0.45, 1.0 - this.upgrades.batteryLevel * 0.1);
      const drainRate = (this.boostTimeLeft > 0 ? 5.5 : 1.6) * batteryDrainMult;
      if (!this.isDrafting) {
        this.heroBattery = Math.max(0, this.heroBattery - drainRate * dt);
      }
    }

    // Continuous tire water spray mist when racing in monsoon rain
    if (this.weatherState.rainIntensity > 0.25 && this.heroSpeed > 160 && Math.random() < 0.5) {
      this.particles.push({
        x: this.heroX - 32,
        y: this.heroY + 6,
        vx: -160 - Math.random() * 70,
        vy: -15 - Math.random() * 35,
        size: 2.8,
        color: 'rgba(180, 220, 255, 0.65)',
        alpha: 0.7,
        life: 0.24,
      });
    }

    // Update vehicle world position
    this.heroX += this.heroSpeed * dt;
    const speedKmh = Math.floor((this.heroSpeed / 540) * 36);

    // Update wheel rotation angle
    this.wheelAngle += (this.heroSpeed / 18) * dt;

    // Update motor audio synthesis
    sound.updateMotor(speedKmh, targetThrottle);

    // -------------------------------------------------------------
    // 2. STEERING & CENTRIFUGAL ROLL PHYSICS (Traction & Slip)
    // -------------------------------------------------------------
    if (this.input.left) this.switchLane('up');
    if (this.input.right) this.switchLane('down');

    const targetY = ROAD_LANES[this.targetLane];
    const laneDelta = targetY - this.heroY;

    // Lane change responsiveness scales with road traction (slower / slippery on wet asphalt)
    const laneMoveSpeed = 380 * (0.55 + traction * 0.45);

    if (Math.abs(laneDelta) > 1.5) {
      const step = Math.sign(laneDelta) * Math.min(Math.abs(laneDelta), laneMoveSpeed * dt);
      this.heroY += step;
      // Increased centrifugal body tilt during slippery turns
      this.heroLeanAngle = Math.sign(laneDelta) * (0.12 / Math.max(0.65, traction));

      // Tire water skid spray on sharp lane switch
      if (this.weatherState.rainIntensity > 0.3 && Math.random() < 0.4) {
        this.particles.push({
          x: this.heroX - 22,
          y: this.heroY + 6,
          vx: -140,
          vy: Math.sign(laneDelta) * 45,
          size: 3,
          color: 'rgba(190, 230, 255, 0.75)',
          alpha: 0.8,
          life: 0.28,
        });
      }
    } else {
      this.heroY = targetY;
      this.heroLane = this.targetLane;
      this.heroLeanAngle *= Math.max(0, 1 - dt * 14);
    }

    // -------------------------------------------------------------
    // 3. SPRING SUSPENSION OSCILLATION
    // -------------------------------------------------------------
    const k = 160;
    const damping = 12;
    const springForce = -k * this.heroSuspensionY - damping * this.suspensionVy;
    this.suspensionVy += springForce * dt;
    this.heroSuspensionY += this.suspensionVy * dt;

    // -------------------------------------------------------------
    // 3.5. BOOST VISUAL TRAIL, PLASMA JET & HYPERSPEED WARP LINES
    // -------------------------------------------------------------
    if (this.boostTimeLeft > 0) {
      // Historical trail node sampling
      if (Math.abs(this.heroX - this.lastTrailSampleX) >= 7 || this.boostTrailNodes.length === 0) {
        this.lastTrailSampleX = this.heroX;
        this.boostTrailNodes.push({
          x: this.heroX - 42,
          y: this.heroY + this.heroSuspensionY,
          leanAngle: this.heroLeanAngle,
          time: this.elapsedTimeSec,
          color: this.skin.glowColor || '#00f2fe',
        });
      }

      // Continuous high-velocity booster sparks and plasma motes
      for (let i = 0; i < 3; i++) {
        const portOffsetY = Math.random() > 0.5 ? -4 : 8;
        this.particles.push({
          x: this.heroX - 42 + Math.random() * 4,
          y: this.heroY + this.heroSuspensionY + portOffsetY + (Math.random() * 8 - 4),
          vx: -this.heroSpeed * 0.55 - (200 + Math.random() * 320),
          vy: (Math.random() - 0.5) * 60,
          size: 2 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#00f2fe' : (Math.random() > 0.5 ? '#ff007f' : '#ffffff'),
          alpha: 0.95,
          life: 0.22 + Math.random() * 0.18,
          kind: 'spark',
        });
      }

      // Periodic sonic shockwaves
      this.shockwaveTimer += dt;
      if (this.shockwaveTimer >= 0.32) {
        this.shockwaveTimer = 0;
        this.boostShockwaves.push({
          x: this.heroX - 42,
          y: this.heroY + this.heroSuspensionY,
          radius: 8,
          maxRadius: 65,
          alpha: 0.9,
          color: Math.random() > 0.5 ? '#00f2fe' : '#ff007f',
          duration: 0.36,
          elapsed: 0,
        });
      }

      // Hyperspeed warp lines across screen edges
      if (this.speedStreaks.length < 22) {
        this.speedStreaks.push({
          x: this.canvas.width + Math.random() * 120,
          y: 30 + Math.random() * (this.canvas.height - 60),
          length: 70 + Math.random() * 160,
          speed: 1400 + Math.random() * 800,
          alpha: 0.3 + Math.random() * 0.45,
          width: 1.2 + Math.random() * 2.0,
          color: Math.random() > 0.3 ? '#00f2fe' : '#ffffff',
        });
      }
    }

    // -------------------------------------------------------------
    // 4. SCENERY & WEATHER UPDATE
    // -------------------------------------------------------------
    this.scenery.update(dt, this.weatherState);

    // -------------------------------------------------------------
    // 5. TRAFFIC SPAWN & BEHAVIOR
    // -------------------------------------------------------------
    this.updateTraffic(dt);

    // -------------------------------------------------------------
    // 6. COLLISIONS & PICKUPS RESOLUTION
    // -------------------------------------------------------------
    this.checkCollisions();

    // -------------------------------------------------------------
    // 7. PARTICLES & FLOATING TEXTS
    // -------------------------------------------------------------
    this.updateEffects(dt);

    // -------------------------------------------------------------
    // 8. NOTIFY HUD & EVENTS
    // -------------------------------------------------------------
    const distanceKm = this.heroX / 12000;
    this.score = Math.floor(distanceKm * 1000 + this.coins * 50 + this.draftingSeconds * 100);

    this.events.onSpeedUpdate(speedKmh);
    this.events.onBatteryUpdate(Math.round(this.heroBattery), this.isRegenerating);
    this.events.onScoreUpdate(this.score, this.coins, distanceKm);
    this.events.onDraftingUpdate(this.isDrafting);

    // Record live player telemetry for Ghost Mode
    this.ghostManager.recordSample(
      this.elapsedTimeSec,
      this.heroX,
      this.heroY,
      this.heroSpeed,
      this.heroLane,
      this.heroLeanAngle,
      this.boostTimeLeft > 0,
      this.input.brake,
      false
    );

    // Live Ghost comparative delta
    const ghostComparison = this.ghostManager.compareWithPlayer(
      this.elapsedTimeSec,
      this.heroX,
      this.heroSpeed
    );
    this.events.onGhostUpdate?.(ghostComparison);

    // Check race finish condition for story route
    if (this.route.km !== Infinity && distanceKm >= this.route.km) {
      this.triggerFinish(true);
    }
  }

  /**
   * Aerodynamic Drafting / Slipstream behind buses
   */
  private checkSlipstreamDrafting(dt: number) {
    this.isDrafting = false;
    for (const entity of this.traffic) {
      if (entity.kind === 'bus' && entity.lane === this.heroLane) {
        const gap = entity.x - this.heroX;
        if (gap > 80 && gap < 230) {
          this.isDrafting = true;
          this.draftingSeconds += dt;
          this.heroSpeed += 40 * dt;
          if (Math.random() < 0.2) {
            this.particles.push({
              x: this.heroX - 10 + Math.random() * 20,
              y: this.heroY + Math.random() * 20 - 10,
              vx: -150,
              vy: 0,
              size: 2,
              color: '#4cc3ff',
              alpha: 0.7,
              life: 0.3,
            });
          }
          break;
        }
      }
    }
  }

  private updateTraffic(dt: number) {
    const horizon = this.heroX + 1300;
    while (this.nextSpawnX < horizon) {
      this.spawnEntity(this.nextSpawnX);
      const density = this.route.trafficDensity;
      this.nextSpawnX += (240 + Math.random() * 300) / density;
    }

    for (const entity of this.traffic) {
      entity.x += entity.vx * dt;

      if (entity.kind === 'rival') {
        entity.vx = 420 + Math.sin(this.elapsedTimeSec * 2 + entity.id) * 60;
      }
    }

    this.traffic = this.traffic.filter((e) => e.x > this.heroX - 500 && !e.collected);
  }

  private spawnEntity(x: number) {
    const lane = Math.floor(Math.random() * 3);
    const y = ROAD_LANES[lane];

    const roll = Math.random();
    let kind: TrafficEntity['kind'] = 'car';
    let vx = 0;

    if (roll < 0.28) {
      kind = 'coin';
    } else if (roll < 0.38) {
      kind = 'battery';
    } else if (roll < 0.44) {
      kind = 'boost';
    } else if (roll < 0.48) {
      kind = 'tea';
    } else if (roll < 0.6) {
      kind = 'cng';
      vx = 260 + Math.random() * 80;
    } else if (roll < 0.74) {
      kind = 'bus';
      vx = 220 + Math.random() * 60;
    } else if (roll < 0.86) {
      kind = 'pothole';
    } else if (roll < 0.94 && (this.route.weather === 'rain' || this.weatherState.rainIntensity > 0.3)) {
      kind = 'puddle';
    } else {
      kind = 'person';
      vx = 15;
    }

    const busColors = ['#d63031', '#0984e3', '#00b894', '#e17055'];

    this.traffic.push({
      id: this.nextEntityId++,
      kind,
      x,
      lane,
      y,
      vx,
      busColor: busColors[Math.floor(Math.random() * busColors.length)],
      hasUmbrella: this.weatherState.rainIntensity > 0.2 || this.route.weather === 'rain',
    });
  }

  private checkCollisions() {
    const heroBox = {
      x1: this.heroX - 35,
      x2: this.heroX + 38,
      y: this.heroY,
    };

    for (const entity of this.traffic) {
      if (entity.collected) continue;

      const laneDist = Math.abs(entity.y - heroBox.y);
      if (laneDist > 40) continue;

      const entityX = entity.x;

      if (entity.kind === 'coin') {
        if (Math.abs(entityX - this.heroX) < 38) {
          entity.collected = true;
          this.coins += 10;
          sound.playCoin();
          this.addFloatingText('+10 ৳', entity.x, entity.y - 30, '#ffd23f');
        }
      } else if (entity.kind === 'battery') {
        if (Math.abs(entityX - this.heroX) < 40) {
          entity.collected = true;
          this.heroBattery = Math.min(100, this.heroBattery + 30);
          sound.playBattery();
          this.addFloatingText('⚡ +30% CHARGE', entity.x, entity.y - 30, '#00e5ff');
        }
      } else if (entity.kind === 'boost') {
        if (Math.abs(entityX - this.heroX) < 40) {
          entity.collected = true;
          this.triggerBoost();
        }
      } else if (entity.kind === 'tea') {
        if (Math.abs(entityX - this.heroX) < 40) {
          entity.collected = true;
          sound.playTea();
          this.heroBattery = Math.min(100, this.heroBattery + 15);
          this.heroSpeed = Math.min(600, this.heroSpeed + 80);
          this.addFloatingText('☕ গরম চা! +BOOST', entity.x, entity.y - 30, '#ff7675');
        }
      } else if (entity.kind === 'pothole') {
        if (Math.abs(entityX - this.heroX) < 35) {
          entity.collected = true;
          this.suspensionVy = -160;
          this.heroSpeed = Math.max(100, this.heroSpeed * 0.7);
          this.screenShake = 6;
          sound.playBump();
          this.addFloatingText('গর্ত! -SPEED', entity.x, entity.y - 30, '#ff7675');
        }
      } else if (entity.kind === 'puddle') {
        if (Math.abs(entityX - this.heroX) < 40) {
          entity.collected = true;
          sound.playSplash();
          for (let i = 0; i < 16; i++) {
            this.particles.push({
              x: this.heroX - 20,
              y: this.heroY + 8,
              vx: -180 + Math.random() * 60,
              vy: -120 - Math.random() * 80,
              size: 3,
              color: 'rgba(160, 220, 255, 0.8)',
              alpha: 0.9,
              life: 0.35,
            });
          }
          this.heroSpeed = Math.max(120, this.heroSpeed * 0.82);
          this.addFloatingText('পানি ছিটকেছে! 💦', entity.x, entity.y - 30, '#4cc3ff');
        }
      } else if (entity.kind === 'bus' || entity.kind === 'cng' || entity.kind === 'person') {
        const hitWidth = entity.kind === 'bus' ? 70 : 36;
        if (Math.abs(entityX - this.heroX) < hitWidth) {
          this.hitstopTimer = 0.05;
          this.screenShake = 12;
          this.heroSpeed = Math.max(40, this.heroSpeed * 0.4);
          sound.playCrash();

          if (entity.kind === 'bus') {
            sound.playHorn(true);
            this.addFloatingText('বাস ধাক্কা! 💥', this.heroX, this.heroY - 45, '#ff3838');
          } else if (entity.kind === 'cng') {
            sound.playHorn(false);
            this.addFloatingText('সিএনজি ধাক্কা! 💥', this.heroX, this.heroY - 45, '#ff3838');
          } else {
            this.addFloatingText('পথচারী সতর্ক! ⚠️', this.heroX, this.heroY - 45, '#ffd23f');
          }

          entity.x += 80;
          entity.vx += 120;
        }
      }
    }
  }

  private updateEffects(dt: number) {
    for (const ft of this.floatingTexts) {
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life);
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life);
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // Update Boost Trail Nodes (0.42s fade window)
    const maxTrailDuration = 0.42;
    this.boostTrailNodes = this.boostTrailNodes.filter(
      (node) => this.elapsedTimeSec - node.time < maxTrailDuration
    );

    // Update Sonic Compression Shockwaves
    for (const sw of this.boostShockwaves) {
      sw.elapsed += dt;
      const progress = sw.elapsed / sw.duration;
      sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 9);
      sw.alpha = Math.max(0, 1 - progress);
    }
    this.boostShockwaves = this.boostShockwaves.filter((sw) => sw.elapsed < sw.duration);

    // Update Viewport Hyperspeed Warp Streaks
    for (const ss of this.speedStreaks) {
      ss.x -= ss.speed * dt;
      if (this.boostTimeLeft <= 0) {
        ss.alpha -= dt * 3.0;
      }
    }
    this.speedStreaks = this.speedStreaks.filter((ss) => ss.x + ss.length > -50 && ss.alpha > 0);
  }

  public addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 1.2,
      vy: -35,
    });
  }

  public triggerFinish(win: boolean) {
    this.stop();
    if (win) sound.playVictory();

    // Evaluate personal record against ghost
    const ghostEval = this.ghostManager.finishAndEvaluateRecord(
      this.route.id,
      Math.floor(this.elapsedTimeSec),
      parseFloat((this.heroX / 12000).toFixed(2)),
      this.score,
      this.skin.id
    );

    this.events.onGameOver({
      win,
      timeSec: Math.floor(this.elapsedTimeSec),
      distanceKm: parseFloat((this.heroX / 12000).toFixed(2)),
      coins: this.coins,
      score: this.score,
      isNewRecord: ghostEval.isNewRecord,
      timeSavedSec: ghostEval.timeSavedSec,
      previousBestTime: ghostEval.previousBestTime,
    });
  }

  // ----------------------------------------------------------------
  // RENDERING PIPELINE (Supports Visibility Fade & Dynamic Weather)
  // ----------------------------------------------------------------
  public render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    const heroScreenX = width * 0.28;
    const camX = this.heroX - heroScreenX;

    // 1. Scenery & Parallax Background (passes DynamicWeatherState)
    this.scenery.render(
      ctx,
      camX,
      width,
      height,
      this.weatherState,
      this.elapsedTimeSec,
      heroScreenX,
      this.heroY
    );

    // 2. Ground Decals (Potholes & Puddles)
    for (const entity of this.traffic) {
      const screenX = entity.x - camX;
      if (screenX < -100 || screenX > width + 100) continue;

      if (entity.kind === 'pothole') {
        RickshawArt.drawPothole(ctx, screenX, entity.y);
      } else if (entity.kind === 'puddle') {
        RickshawArt.drawPuddle(ctx, screenX, entity.y, this.elapsedTimeSec);
      }
    }

    // 3. Collectibles (Coins, Batteries, Boosts, Tea)
    for (const entity of this.traffic) {
      const screenX = entity.x - camX;
      if (screenX < -100 || screenX > width + 100 || entity.collected) continue;

      // Fog visibility fade calculation
      const distFromHero = entity.x - this.heroX;
      let alpha = 1.0;
      if (this.weatherState.visibility < 0.9 && distFromHero > 0) {
        const inHeadlight = distFromHero < 360 && Math.abs(entity.y - this.heroY) < 55;
        if (!inHeadlight) {
          const maxVis = 180 + 300 * this.weatherState.visibility;
          alpha = Math.max(0.1, Math.min(1.0, 1.0 - (distFromHero - 120) / maxVis));
        }
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      if (entity.kind === 'coin') {
        RickshawArt.drawCoin(ctx, screenX, entity.y - 12, this.elapsedTimeSec * 5);
      } else if (entity.kind === 'battery') {
        RickshawArt.drawBattery(ctx, screenX, entity.y - 14, this.elapsedTimeSec);
      } else if (entity.kind === 'boost') {
        RickshawArt.drawBoostItem(ctx, screenX, entity.y - 16, this.elapsedTimeSec);
      } else if (entity.kind === 'tea') {
        RickshawArt.drawTeaItem(ctx, screenX, entity.y - 10, this.elapsedTimeSec);
      }
      ctx.restore();
    }

    // 4. Traffic Vehicles & Pedestrians with Fog Visibility Fade
    for (const entity of this.traffic) {
      const screenX = entity.x - camX;
      if (screenX < -150 || screenX > width + 150) continue;

      const distFromHero = entity.x - this.heroX;
      let alpha = 1.0;
      if (this.weatherState.visibility < 0.9 && distFromHero > 0) {
        const inHeadlight = distFromHero < 380 && Math.abs(entity.y - this.heroY) < 60;
        if (!inHeadlight) {
          const maxVis = 180 + 320 * this.weatherState.visibility;
          alpha = Math.max(0.12, Math.min(1.0, 1.0 - (distFromHero - 120) / maxVis));
        }
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      if (entity.kind === 'cng') {
        RickshawArt.drawCNG(ctx, screenX, entity.y, this.wheelAngle);
      } else if (entity.kind === 'bus') {
        RickshawArt.drawBus(ctx, screenX, entity.y, this.wheelAngle, entity.busColor);
      } else if (entity.kind === 'person') {
        RickshawArt.drawPerson(ctx, screenX, entity.y, this.elapsedTimeSec * 6, entity.hasUmbrella);
      } else if (entity.kind === 'rival' && entity.rivalSkin) {
        RickshawArt.drawRickshaw(
          ctx,
          screenX,
          entity.y,
          entity.rivalSkin,
          30,
          this.wheelAngle,
          0,
          0,
          false,
          false,
          false,
          entity.rivalName
        );
      }
      ctx.restore();
    }

    // 4.5. Ghost Shadow (Holographic Personal Best projection)
    if (this.ghostManager.isGhostEnabled) {
      const ghost = this.ghostManager.getGhostStateAt(this.elapsedTimeSec);
      if (ghost && !ghost.finished) {
        const ghostScreenX = ghost.x - camX;
        // Cull if way off screen
        if (ghostScreenX > -150 && ghostScreenX < width + 150) {
          const deltaMeters = Math.round((this.heroX - ghost.x) / 12);
          const badgeText = deltaMeters >= 0 ? `PB -${deltaMeters}m` : `PB +${Math.abs(deltaMeters)}m`;
          RickshawArt.drawGhostShadow(
            ctx,
            ghostScreenX,
            ghost.y,
            this.wheelAngle,
            ghost.leanAngle,
            ghost.isBoosting,
            this.elapsedTimeSec,
            badgeText
          );
        }
      }
    }

    // 4.8. Visual Boost Trail & Hyperspeed Glow Streaks
    this.drawBoostTrail(ctx, camX, width, height);

    // 5. The Bangla Tesla Hero Rickshaw
    const speedKmh = Math.floor((this.heroSpeed / 540) * 36);
    RickshawArt.drawRickshaw(
      ctx,
      heroScreenX,
      this.heroY,
      this.skin,
      speedKmh,
      this.wheelAngle,
      this.heroSuspensionY,
      this.heroLeanAngle,
      this.boostTimeLeft > 0,
      this.input.brake,
      this.heroBattery <= 0
    );

    // 6. Particles (exhaust, water spray, high-speed sparks)
    for (const p of this.particles) {
      const screenX = p.x - camX;
      if (screenX < -60 || screenX > width + 60) continue;

      if (p.kind === 'spark') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(screenX, p.y);
        ctx.lineTo(screenX - p.vx * 0.045, p.y - p.vy * 0.045);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 7. Floating Texts (damage, coins, bell shouts)
    for (const ft of this.floatingTexts) {
      const screenX = ft.x - camX;
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, screenX, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renders the multi-tier neon glow streak trail, volumetric energy ribbon,
   * holographic after-images, sonic compression shockwaves, and warp speed streaks.
   */
  private drawBoostTrail(
    ctx: CanvasRenderingContext2D,
    camX: number,
    width: number,
    height: number
  ) {
    // 1. Draw Viewport Hyperspeed Warp Streaks across the scenery/road
    if (this.speedStreaks.length > 0) {
      ctx.save();
      for (const ss of this.speedStreaks) {
        ctx.strokeStyle = ss.color;
        ctx.globalAlpha = ss.alpha;
        ctx.lineWidth = ss.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.length, ss.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Sonic Compression Shockwaves
    if (this.boostShockwaves.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sw of this.boostShockwaves) {
        const screenX = sw.x - camX;
        if (screenX < -120 || screenX > width + 120) continue;
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha * 0.9;
        ctx.lineWidth = Math.max(1, 3.5 * (1 - sw.elapsed / sw.duration));
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        // Slightly squashed vertical ellipse representing supersonic shock barrier
        ctx.ellipse(screenX, sw.y, sw.radius * 0.45, sw.radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Draw Neon Trail Ribbon & Streamlines
    const nodes = this.boostTrailNodes;
    if (nodes.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const maxTrailDuration = 0.42;

    // A. Holographic After-Image Silhouettes along the trail
    const sampleStep = Math.max(6, Math.floor(nodes.length / 4));
    for (let i = 0; i < nodes.length - 2; i += sampleStep) {
      const node = nodes[i];
      const age = this.elapsedTimeSec - node.time;
      const alpha = Math.max(0, 1 - age / maxTrailDuration) * 0.35;
      const screenX = node.x - camX;
      if (screenX > -100 && screenX < width + 100) {
        RickshawArt.drawBoostAfterImage(ctx, screenX, node.y, node.leanAngle, alpha, node.color);
      }
    }

    // Precalculate screen coordinates and normalized alpha for each node
    interface ScreenNode {
      sx: number;
      sy: number;
      alpha: number;
      topY: number;
      midY: number;
      botY: number;
      wheelY: number;
      color: string;
    }

    const screenNodes: ScreenNode[] = [];
    for (const node of nodes) {
      const sx = node.x - camX;
      const age = this.elapsedTimeSec - node.time;
      const alpha = Math.max(0, 1 - age / maxTrailDuration);
      if (alpha <= 0.01) continue;

      const cosA = Math.cos(node.leanAngle);

      // Canopy top streamer (-24px up)
      const topY = node.y - 24 * cosA;
      // Thruster streamer (-4px)
      const midY = node.y - 4 * cosA;
      // Chassis bottom streamer (+6px)
      const botY = node.y + 6 * cosA;
      // Wheel contact streamer (+12px)
      const wheelY = node.y + 12 * cosA;

      screenNodes.push({
        sx,
        sy: node.y,
        alpha,
        topY,
        midY,
        botY,
        wheelY,
        color: node.color,
      });
    }

    if (screenNodes.length >= 2) {
      // B. Volumetric Neon Energy Ribbon Mesh (connecting top stream to bot stream)
      for (let i = 0; i < screenNodes.length - 1; i++) {
        const p1 = screenNodes[i];
        const p2 = screenNodes[i + 1];

        const avgAlpha = (p1.alpha + p2.alpha) * 0.5;
        const grad = ctx.createLinearGradient(p1.sx, p1.sy, p2.sx, p2.sy);
        grad.addColorStop(0, `rgba(255, 0, 128, ${avgAlpha * 0.35})`);
        grad.addColorStop(1, `rgba(0, 242, 254, ${avgAlpha * 0.45})`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.topY);
        ctx.lineTo(p2.sx, p2.topY);
        ctx.lineTo(p2.sx, p2.botY);
        ctx.lineTo(p1.sx, p1.botY);
        ctx.closePath();
        ctx.fill();
      }

      // Helper function to draw smooth glowing streamline curves
      const drawStreamline = (
        getY: (sn: ScreenNode) => number,
        outerColor: string,
        outerWidth: number,
        innerColor: string,
        innerWidth: number
      ) => {
        // Outer glow pass
        ctx.beginPath();
        ctx.moveTo(screenNodes[0].sx, getY(screenNodes[0]));
        for (let i = 1; i < screenNodes.length; i++) {
          const prev = screenNodes[i - 1];
          const curr = screenNodes[i];
          const midX = (prev.sx + curr.sx) * 0.5;
          const midY = (getY(prev) + getY(curr)) * 0.5;
          ctx.quadraticCurveTo(prev.sx, getY(prev), midX, midY);
        }
        ctx.lineTo(screenNodes[screenNodes.length - 1].sx, getY(screenNodes[screenNodes.length - 1]));

        ctx.strokeStyle = outerColor;
        ctx.lineWidth = outerWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Inner intense core pass
        ctx.beginPath();
        ctx.moveTo(screenNodes[0].sx, getY(screenNodes[0]));
        for (let i = 1; i < screenNodes.length; i++) {
          const prev = screenNodes[i - 1];
          const curr = screenNodes[i];
          const midX = (prev.sx + curr.sx) * 0.5;
          const midY = (getY(prev) + getY(curr)) * 0.5;
          ctx.quadraticCurveTo(prev.sx, getY(prev), midX, midY);
        }
        ctx.lineTo(screenNodes[screenNodes.length - 1].sx, getY(screenNodes[screenNodes.length - 1]));

        ctx.strokeStyle = innerColor;
        ctx.lineWidth = innerWidth;
        ctx.stroke();
      };

      // C. Streamline 1: Roof / Canopy Aerodynamic Streak
      drawStreamline(
        (sn) => sn.topY,
        'rgba(0, 242, 254, 0.45)',
        7,
        'rgba(255, 255, 255, 0.85)',
        2.2
      );

      // D. Streamline 2: Central Plasma Jet Streak (Thruster Axis)
      drawStreamline(
        (sn) => sn.midY,
        'rgba(255, 0, 127, 0.55)',
        9,
        'rgba(0, 242, 254, 0.95)',
        2.8
      );

      // E. Streamline 3: Underbody / Ground Contact Glow Streak
      drawStreamline(
        (sn) => sn.wheelY,
        'rgba(0, 229, 255, 0.4)',
        6,
        'rgba(255, 255, 255, 0.7)',
        1.8
      );
    }

    ctx.restore();
  }
}
