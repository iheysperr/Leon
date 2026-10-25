/**
 * Ghost Mode & Personal Record Shadow Recording Engine
 * Records player telemetry (position, lane, speed, lean angle, boost, bell)
 * and allows racing against an interpolated holographic personal-best shadow.
 */

import { GhostComparison, GhostFrame, RouteGhostData } from '../types/game';

const GHOST_STORAGE_KEY = 'bangla_tesla_route_ghosts_v1';
const SAMPLE_INTERVAL_SEC = 0.1; // 10Hz sampling

export class GhostManager {
  private activeRecording: GhostFrame[] = [];
  private lastSampleTime: number = 0;
  private currentGhost: RouteGhostData | null = null;
  public isGhostEnabled: boolean = true;

  public toggleGhost(): boolean {
    this.isGhostEnabled = !this.isGhostEnabled;
    return this.isGhostEnabled;
  }

  public getCurrentGhost(): RouteGhostData | null {
    return this.currentGhost;
  }

  constructor() {
    // Loaded per route
  }

  /**
   * Loads the personal best ghost for a given route from localStorage
   * Falls back to a realistic baseline record ghost if no run has been completed yet.
   */
  public loadGhostForRoute(routeId: string, routeKm: number): RouteGhostData | null {
    try {
      const stored = localStorage.getItem(GHOST_STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, RouteGhostData> = JSON.parse(stored);
        if (parsed[routeId] && parsed[routeId].frames && parsed[routeId].frames.length > 5) {
          this.currentGhost = parsed[routeId];
          return this.currentGhost;
        }
      }
    } catch {
      // localStorage fallback
    }

    // Generate a challenging, realistic baseline ghost for the route
    this.currentGhost = this.generateBaselineGhost(routeId, routeKm);
    return this.currentGhost;
  }

  /**
   * Resets telemetry buffer for a new race attempt
   */
  public startRecording() {
    this.activeRecording = [];
    this.lastSampleTime = -1;
  }

  /**
   * Records a frame sample at ~10Hz
   */
  public recordSample(
    t: number,
    x: number,
    y: number,
    speed: number,
    lane: number,
    leanAngle: number,
    isBoosting: boolean,
    isBraking: boolean,
    bellRung: boolean
  ) {
    if (t - this.lastSampleTime < SAMPLE_INTERVAL_SEC && !bellRung && !isBoosting) {
      return;
    }

    this.lastSampleTime = t;
    this.activeRecording.push({
      t: parseFloat(t.toFixed(2)),
      x: Math.round(x),
      y: Math.round(y),
      speed: Math.round(speed),
      lane,
      leanAngle: parseFloat(leanAngle.toFixed(3)),
      isBoosting,
      isBraking,
      bellRung,
    });
  }

  /**
   * Samples the ghost shadow at time t using linear interpolation
   */
  public getGhostStateAt(t: number): (GhostFrame & { finished: boolean }) | null {
    if (!this.isGhostEnabled || !this.currentGhost || this.currentGhost.frames.length === 0) {
      return null;
    }

    const frames = this.currentGhost.frames;
    if (t >= frames[frames.length - 1].t) {
      const last = frames[frames.length - 1];
      return { ...last, finished: true };
    }

    // Binary search for closest bounding frames
    let low = 0;
    let high = frames.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (frames[mid].t <= t) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i0 = Math.max(0, high);
    const i1 = Math.min(frames.length - 1, low);

    const f0 = frames[i0];
    const f1 = frames[i1];

    if (f0 === f1 || f1.t === f0.t) {
      return { ...f0, finished: false };
    }

    const factor = Math.max(0, Math.min(1, (t - f0.t) / (f1.t - f0.t)));

    return {
      t,
      x: f0.x + (f1.x - f0.x) * factor,
      y: f0.y + (f1.y - f0.y) * factor,
      speed: f0.speed + (f1.speed - f0.speed) * factor,
      lane: factor > 0.5 ? f1.lane : f0.lane,
      leanAngle: f0.leanAngle + (f1.leanAngle - f0.leanAngle) * factor,
      isBoosting: f0.isBoosting || f1.isBoosting,
      isBraking: f0.isBraking || f1.isBraking,
      bellRung: f0.bellRung || f1.bellRung,
      finished: false,
    };
  }

  /**
   * Compares the player's live position with the personal record shadow
   */
  public compareWithPlayer(
    t: number,
    heroX: number,
    heroSpeed: number
  ): GhostComparison {
    const ghost = this.getGhostStateAt(t);
    if (!ghost) {
      return {
        deltaDistanceMeters: 0,
        deltaTimeSec: 0,
        ghostX: 0,
        ghostY: 0,
        ghostSpeed: 0,
        hasGhost: false,
      };
    }

    // 12px per meter in world scale (12000px = 1km)
    const deltaDistanceMeters = parseFloat(((heroX - ghost.x) / 12).toFixed(1));
    const effectiveSpeed = Math.max(120, heroSpeed) / 12; // meters/s
    const deltaTimeSec = parseFloat((deltaDistanceMeters / effectiveSpeed).toFixed(2));

    return {
      deltaDistanceMeters,
      deltaTimeSec,
      ghostX: ghost.x,
      ghostY: ghost.y,
      ghostSpeed: ghost.speed,
      hasGhost: true,
    };
  }

  /**
   * Finishes race attempt and saves new personal record if superior
   */
  public finishAndEvaluateRecord(
    routeId: string,
    totalTime: number,
    distanceKm: number,
    score: number,
    skinId: string
  ): { isNewRecord: boolean; timeSavedSec: number; previousBestTime?: number } {
    if (this.activeRecording.length < 10) {
      return { isNewRecord: false, timeSavedSec: 0 };
    }

    let isNewRecord = false;
    let timeSavedSec = 0;
    let prevBest: number | undefined = undefined;

    if (!this.currentGhost) {
      isNewRecord = true;
    } else if (routeId === 'endless') {
      // For endless, higher score & distance is better
      if (score > this.currentGhost.score) {
        isNewRecord = true;
      }
    } else {
      // For story routes, lower finish time is better
      prevBest = this.currentGhost.totalTime;
      if (totalTime < this.currentGhost.totalTime) {
        isNewRecord = true;
        timeSavedSec = parseFloat((this.currentGhost.totalTime - totalTime).toFixed(2));
      }
    }

    if (isNewRecord) {
      const newGhost: RouteGhostData = {
        routeId,
        totalTime,
        distanceKm,
        score,
        skinId,
        recordedAt: new Date().toISOString(),
        frames: [...this.activeRecording],
      };

      this.currentGhost = newGhost;
      this.saveGhostToStorage(routeId, newGhost);
    }

    return { isNewRecord, timeSavedSec, previousBestTime: prevBest };
  }

  private saveGhostToStorage(routeId: string, ghost: RouteGhostData) {
    try {
      const stored = localStorage.getItem(GHOST_STORAGE_KEY);
      const data: Record<string, RouteGhostData> = stored ? JSON.parse(stored) : {};
      data[routeId] = ghost;
      localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage quota fallback
    }
  }

  /**
   * Procedurally generates a challenging initial baseline ghost run
   */
  private generateBaselineGhost(routeId: string, routeKm: number): RouteGhostData {
    const isEndless = routeKm === Infinity;
    const targetKm = isEndless ? 15 : routeKm;
    const frames: GhostFrame[] = [];

    const totalDistancePx = targetKm * 12000;
    let currX = 0;
    let currTime = 0;
    let currLane = 1;
    let currSpeed = 440; // baseline cruise

    frames.push({
      t: 0,
      x: 0,
      y: 480,
      speed: 0,
      lane: 1,
      leanAngle: 0,
      isBoosting: false,
      isBraking: false,
      bellRung: false,
    });

    while (currX < totalDistancePx && currTime < 400) {
      currTime += 0.15;
      // Baseline pacing with periodic boosts and lane weaves
      const isBoost = Math.sin(currTime * 0.4) > 0.85;
      const targetSpeed = isBoost ? 720 : 460 + Math.sin(currTime * 0.8) * 40;
      currSpeed += (targetSpeed - currSpeed) * 0.15;
      currX += currSpeed * 0.15;

      if (Math.sin(currTime * 0.25) > 0.7) {
        currLane = (Math.floor(currTime * 0.4) % 3);
      }

      frames.push({
        t: parseFloat(currTime.toFixed(2)),
        x: Math.round(currX),
        y: currLane * 80 + 400,
        speed: Math.round(currSpeed),
        lane: currLane,
        leanAngle: Math.sin(currTime * 2) * 0.05,
        isBoosting: isBoost,
        isBraking: false,
        bellRung: Math.random() < 0.03,
      });
    }

    return {
      routeId,
      totalTime: parseFloat(currTime.toFixed(2)),
      distanceKm: targetKm,
      score: Math.floor(targetKm * 1000 + 400),
      skinId: 'tesla',
      recordedAt: 'Baseline Record',
      frames,
    };
  }
}
