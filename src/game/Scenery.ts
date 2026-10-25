/**
 * Dhaka City Dynamic Scenery & Parallax Background Engine
 * Renders authentic Dhaka landmarks (Jatiya Sangsad, TSC, Elevated Expressway,
 * neon billboards, monsoon cloudbursts, rolling winter fog/smog, and wet asphalt reflections).
 */

import { DynamicWeatherState, WeatherType } from '../types/game';
import { sound } from './AudioSynthesizer';

export const ROAD_LANES = [400, 480, 560]; // Y positions for 3 lanes
export const ROAD_TOP = 340;
export const ROAD_BOTTOM = 620;

export interface RainDrop {
  x: number;
  y: number;
  speed: number;
  len: number;
  alpha: number;
}

export class Scenery {
  private raindrops: RainDrop[] = [];
  private lightningAlpha: number = 0;
  private lightningTimer: number = 5;

  constructor() {
    // Pre-populate dense rain drops for monsoon cloudbursts
    for (let i = 0; i < 160; i++) {
      this.raindrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 750,
        speed: 750 + Math.random() * 600,
        len: 14 + Math.random() * 20,
        alpha: 0.25 + Math.random() * 0.5,
      });
    }
  }

  public update(dt: number, weather: DynamicWeatherState) {
    if (weather.rainIntensity > 0.05) {
      const activeCount = Math.floor(this.raindrops.length * Math.min(1.0, weather.rainIntensity * 1.2));
      const windDrift = weather.windSpeed * 0.6;

      for (let i = 0; i < activeCount; i++) {
        const drop = this.raindrops[i];
        drop.y += drop.speed * dt * (0.7 + weather.rainIntensity * 0.6);
        drop.x += (windDrift - drop.speed * 0.3) * dt;
        if (drop.y > 720) {
          drop.y = -20;
          drop.x = Math.random() * 1600 + 100;
        }
      }

      // Lightning flashes in heavy monsoon cloudburst
      if (weather.rainIntensity > 0.4) {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          this.lightningAlpha = 0.9;
          this.lightningTimer = 5 + Math.random() * 8;
          sound.playThunder();
        }
      }
    }

    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 3.5);
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    width: number,
    height: number,
    weather: DynamicWeatherState,
    timeSec: number,
    heroScreenX: number = 300,
    heroY: number = 480
  ) {
    // 1. Sky Gradient based on weather/time/fog
    this.renderSky(ctx, width, height, weather);

    // 2. Distant Dhaka Skyline (Parallax factor 0.05)
    // Fades out into distance fog / smog
    if (weather.visibility > 0.4) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, (weather.visibility - 0.3) / 0.5);
      this.renderSkyline(ctx, camX * 0.05, width, weather.current);
      ctx.restore();
    }

    // 3. Midground Elevated Expressway & Flyover Pillars (Parallax factor 0.2)
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, (weather.visibility - 0.2) / 0.6);
    this.renderMidground(ctx, camX * 0.2, width, weather.current);
    ctx.restore();

    // 4. Near Billboards, Electric Poles & Streetlamps (Parallax factor 0.6)
    this.renderForegroundPoles(ctx, camX * 0.6, width, weather.current, timeSec, weather.fogDensity);

    // 5. Asphalt Road with 3 lanes & wet specular reflections (CamX factor 1.0)
    this.renderRoad(ctx, camX, width, weather);

    // 6. Rain streaks & lightning overlay
    if (weather.rainIntensity > 0.05) {
      this.renderRain(ctx, width, height, weather.rainIntensity, weather.windSpeed);
    }

    // 7. Dynamic Fog & Mist Banks Overlay
    if (weather.fogDensity > 0.05) {
      this.renderFog(ctx, width, height, timeSec, weather.fogDensity, heroScreenX, heroY);
    }
  }

  private renderSky(ctx: CanvasRenderingContext2D, width: number, height: number, weather: DynamicWeatherState) {
    const grad = ctx.createLinearGradient(0, 0, 0, ROAD_TOP);

    if (weather.fogDensity > 0.35) {
      // Dhaka Winter Smog / Fog Atmosphere
      if (weather.current === 'night' || weather.current === 'rain') {
        grad.addColorStop(0, '#151922');
        grad.addColorStop(0.5, '#222936');
        grad.addColorStop(1, '#333e50');
      } else {
        grad.addColorStop(0, '#7f8c8d');
        grad.addColorStop(0.5, '#95a5a6');
        grad.addColorStop(1, '#bdc3c7');
      }
    } else if (weather.current === 'night' || weather.current === 'rain') {
      grad.addColorStop(0, '#0a0518');
      grad.addColorStop(0.5, '#190e32');
      grad.addColorStop(1, '#2c1454');
    } else if (weather.current === 'sunset') {
      grad.addColorStop(0, '#2e124d');
      grad.addColorStop(0.4, '#87255b');
      grad.addColorStop(0.75, '#d35400');
      grad.addColorStop(1, '#f39c12');
    } else {
      // Day
      grad.addColorStop(0, '#3a7bd5');
      grad.addColorStop(0.65, '#56ccf2');
      grad.addColorStop(1, '#bfe9ff');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, ROAD_TOP);

    // Sun / Cyber Moon (dimmed if heavy fog or cloudburst)
    if (weather.visibility > 0.5) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, (weather.visibility - 0.4) * 2);

      if (weather.current === 'day') {
        ctx.fillStyle = '#fff4cc';
        ctx.shadowColor = '#ffeaa7';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(width * 0.75, 70, 32, 0, Math.PI * 2);
        ctx.fill();
      } else if (weather.current === 'sunset') {
        ctx.fillStyle = '#ff7675';
        ctx.shadowColor = '#fdcb6e';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.arc(width * 0.78, 90, 42, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Cyber neon moon
        ctx.fillStyle = '#e0f7fa';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(width * 0.82, 60, 24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderSkyline(ctx: CanvasRenderingContext2D, px: number, width: number, weather: WeatherType) {
    const isDark = weather === 'night' || weather === 'rain' || weather === 'fog';
    const baseColor = isDark ? '#140c26' : weather === 'sunset' ? '#3d1645' : '#8fa8c6';
    const windowColor = isDark ? '#ffd166' : '#fff';

    ctx.fillStyle = baseColor;

    // Repeating skyline buildings
    const patternWidth = 900;
    const offset = -(px % patternWidth);

    for (let x = offset - patternWidth; x < width + patternWidth; x += patternWidth) {
      // Modern Dhaka highrises
      ctx.fillRect(x + 40, 160, 90, 180);
      ctx.fillRect(x + 150, 120, 80, 220);
      ctx.fillRect(x + 250, 190, 110, 150);

      // Jatiya Sangsad / Parliament shaped geometric structure
      ctx.beginPath();
      ctx.moveTo(x + 400, 340);
      ctx.lineTo(x + 400, 220);
      ctx.lineTo(x + 460, 190);
      ctx.lineTo(x + 520, 220);
      ctx.lineTo(x + 520, 340);
      ctx.fill();

      // Parliament geometric cutouts
      if (isDark) {
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(x + 460, 240, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = baseColor;
      }

      // TSC dome silhouette
      ctx.beginPath();
      ctx.arc(x + 620, 260, 35, Math.PI, 0, false);
      ctx.lineTo(x + 665, 340);
      ctx.lineTo(x + 575, 340);
      ctx.closePath();
      ctx.fill();

      // TV transmission tower with flashing red beacon
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 750, 340);
      ctx.lineTo(x + 775, 100);
      ctx.lineTo(x + 800, 340);
      ctx.stroke();

      // Red blinking beacon at tower tip
      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(x + 775, 100, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = baseColor;

      // Illuminated high-rise windows
      if (isDark) {
        ctx.fillStyle = windowColor;
        for (let wy = 140; wy < 310; wy += 22) {
          ctx.fillRect(x + 165, wy, 8, 10);
          ctx.fillRect(x + 195, wy, 8, 10);
          if (wy > 180) {
            ctx.fillRect(x + 60, wy, 8, 8);
            ctx.fillRect(x + 95, wy, 8, 8);
          }
        }
        ctx.fillStyle = baseColor;
      }
    }
  }

  private renderMidground(ctx: CanvasRenderingContext2D, px: number, width: number, weather: WeatherType) {
    const isDark = weather === 'night' || weather === 'rain' || weather === 'fog';
    const pillarColor = isDark ? '#1e1438' : '#6b7b8c';
    const deckColor = isDark ? '#281a4a' : '#8898aa';

    // Flyover deck
    ctx.fillStyle = deckColor;
    ctx.fillRect(0, 255, width, 18);

    // Guardrail
    ctx.fillStyle = isDark ? '#00e5ff' : '#cbd5e1';
    ctx.fillRect(0, 252, width, 3);

    // Pillars spaced every 260px
    const spacing = 260;
    const offset = -(px % spacing);

    ctx.fillStyle = pillarColor;
    for (let x = offset - spacing; x < width + spacing; x += spacing) {
      ctx.fillRect(x + 60, 273, 24, 70);

      // Support head
      ctx.beginPath();
      ctx.moveTo(x + 40, 273);
      ctx.lineTo(x + 104, 273);
      ctx.lineTo(x + 84, 290);
      ctx.lineTo(x + 60, 290);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderForegroundPoles(
    ctx: CanvasRenderingContext2D,
    px: number,
    width: number,
    weather: WeatherType,
    timeSec: number,
    fogDensity: number = 0
  ) {
    const isDark = weather === 'night' || weather === 'rain' || weather === 'fog';
    const spacing = 420;
    const offset = -(px % spacing);

    const signs = [
      { text: 'বাংলা টেসলা', sub: 'BANGLA TESLA EV', color: '#ffd23f' },
      { text: 'সুপারচার্জার', sub: 'SUPERCHARGER V4', color: '#00e5ff' },
      { text: 'ঢাকা ২০৭৭', sub: 'DHAKA CYBER CITY', color: '#ff2a85' },
      { text: 'চা স্টল', sub: 'HOT CHA BOOST', color: '#35d07f' },
    ];

    for (let i = -1; i < Math.ceil(width / spacing) + 1; i++) {
      const x = offset + i * spacing;
      const signIndex = Math.abs(Math.floor((px + x) / spacing)) % signs.length;
      const sign = signs[signIndex];

      // Pole
      ctx.fillStyle = isDark ? '#110b22' : '#475569';
      ctx.fillRect(x, 150, 8, 190);

      // Street lamp arm
      ctx.strokeStyle = isDark ? '#110b22' : '#475569';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 4, 160);
      ctx.lineTo(x + 55, 140);
      ctx.lineTo(x + 65, 148);
      ctx.stroke();

      // Street lamp bulb & Fog Glow Halo
      const lampGlow = isDark ? '#ffd700' : '#ffffff';
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(x + 65, 150, 6, 0, Math.PI * 2);
      ctx.fill();

      // In Fog: Atmospheric scattering halo around street lamps
      if (fogDensity > 0.15) {
        ctx.save();
        const haloGrad = ctx.createRadialGradient(x + 65, 150, 5, x + 65, 150, 45 + fogDensity * 35);
        haloGrad.addColorStop(0, 'rgba(255, 230, 120, 0.45)');
        haloGrad.addColorStop(0.5, 'rgba(255, 220, 100, 0.18)');
        haloGrad.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(x + 65, 150, 45 + fogDensity * 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Volumetric light cone onto the road at night
      if (isDark) {
        ctx.save();
        const coneGrad = ctx.createRadialGradient(x + 65, 152, 5, x + 65, 420, 260);
        coneGrad.addColorStop(0, 'rgba(255, 220, 100, 0.22)');
        coneGrad.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(x + 65, 152);
        ctx.lineTo(x - 90, 480);
        ctx.lineTo(x + 220, 480);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Tangled Dhaka overhead cables
      ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(50,50,50,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, 180);
      ctx.quadraticCurveTo(x + spacing * 0.5, 210, x + spacing + 4, 180);
      ctx.moveTo(x + 4, 190);
      ctx.quadraticCurveTo(x + spacing * 0.5, 225, x + spacing + 4, 190);
      ctx.stroke();

      // Neon Billboard sign
      if (x > -150 && x < width + 150) {
        ctx.save();
        ctx.fillStyle = '#0f0a1e';
        ctx.strokeStyle = sign.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = isDark ? sign.color : 'transparent';
        ctx.shadowBlur = isDark ? 12 : 0;

        ctx.fillRect(x - 90, 175, 85, 45);
        ctx.strokeRect(x - 90, 175, 85, 45);

        ctx.shadowBlur = 0;
        ctx.fillStyle = sign.color;
        ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sign.text, x - 47, 195);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(sign.sub, x - 47, 210);
        ctx.restore();
      }
    }
  }

  private renderRoad(ctx: CanvasRenderingContext2D, camX: number, width: number, weather: DynamicWeatherState) {
    // Sidewalk curb
    ctx.fillStyle = '#1e1a29';
    ctx.fillRect(0, ROAD_TOP - 16, width, 16);

    // Yellow & black curb stripes
    const curbSpacing = 36;
    const curbOffset = -(camX % (curbSpacing * 2));
    for (let cx = curbOffset - curbSpacing * 2; cx < width + curbSpacing; cx += curbSpacing * 2) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(cx, ROAD_TOP - 16, curbSpacing, 16);
    }

    // Asphalt surface (slick & reflective during rain)
    const asphaltGrad = ctx.createLinearGradient(0, ROAD_TOP, 0, ROAD_BOTTOM);
    if (weather.rainIntensity > 0.2) {
      // Wet reflective asphalt with glossy water sheen
      asphaltGrad.addColorStop(0, '#0f0e17');
      asphaltGrad.addColorStop(0.3, '#1a1829');
      asphaltGrad.addColorStop(0.7, '#120f20');
      asphaltGrad.addColorStop(1, '#0b0914');
    } else {
      asphaltGrad.addColorStop(0, '#221e33');
      asphaltGrad.addColorStop(0.5, '#28233d');
      asphaltGrad.addColorStop(1, '#1b172a');
    }
    ctx.fillStyle = asphaltGrad;
    ctx.fillRect(0, ROAD_TOP, width, ROAD_BOTTOM - ROAD_TOP);

    // In Monsoon: water reflections of neon signs on wet road
    if (weather.rainIntensity > 0.3) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.fillRect(0, ROAD_TOP + 20, width, 8);
      ctx.fillStyle = 'rgba(255, 79, 163, 0.06)';
      ctx.fillRect(0, ROAD_TOP + 80, width, 12);
      ctx.restore();
    }

    // Lane Divider Markings (Dashed white/cyan neon lines between lanes)
    const dashLength = 55;
    const dashGap = 45;
    const dashTotal = dashLength + dashGap;
    const dashOffset = -(camX % dashTotal);

    const laneDividers = [
      (ROAD_LANES[0] + ROAD_LANES[1]) / 2,
      (ROAD_LANES[1] + ROAD_LANES[2]) / 2,
    ];

    laneDividers.forEach((y) => {
      ctx.fillStyle = weather.current === 'night' ? 'rgba(76, 195, 255, 0.75)' : 'rgba(255, 255, 255, 0.7)';
      if (weather.current === 'night') {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
      }
      for (let x = dashOffset - dashTotal; x < width + dashTotal; x += dashTotal) {
        ctx.fillRect(x, y - 2, dashLength, 4);
      }
      ctx.shadowBlur = 0;
    });

    // Lower road edge / shoulder
    ctx.fillStyle = '#100c1c';
    ctx.fillRect(0, ROAD_BOTTOM, width, 120);
  }

  private renderRain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rainIntensity: number,
    windSpeed: number
  ) {
    const activeCount = Math.floor(this.raindrops.length * Math.min(1.0, rainIntensity * 1.2));
    ctx.strokeStyle = `rgba(180, 220, 255, ${0.35 + rainIntensity * 0.35})`;
    ctx.lineWidth = 1.4 + rainIntensity * 0.8;

    const angleX = (windSpeed * 0.002) - 0.35;

    ctx.beginPath();
    for (let i = 0; i < activeCount; i++) {
      const drop = this.raindrops[i];
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.len * angleX, drop.y + drop.len);
    }
    ctx.stroke();

    // Lightning flash screen effect
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(230, 245, 255, ${this.lightningAlpha * 0.45})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * Volumetric Fog & Mist Blanket
   */
  private renderFog(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeSec: number,
    fogDensity: number,
    heroScreenX: number,
    heroY: number
  ) {
    // 1. Atmospheric Distance Fog Overlay
    const fogGrad = ctx.createLinearGradient(0, ROAD_TOP - 100, 0, ROAD_BOTTOM + 80);
    fogGrad.addColorStop(0, `rgba(180, 195, 215, ${fogDensity * 0.6})`);
    fogGrad.addColorStop(0.4, `rgba(160, 180, 205, ${fogDensity * 0.45})`);
    fogGrad.addColorStop(1, `rgba(130, 150, 180, ${fogDensity * 0.5})`);

    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Rolling horizontal mist banks
    const mistOffset1 = (timeSec * 50) % 450;
    const mistOffset2 = (timeSec * 30) % 600;

    ctx.save();
    ctx.fillStyle = `rgba(215, 230, 245, ${fogDensity * 0.22})`;

    for (let x = -200 - mistOffset1; x < width + 400; x += 400) {
      ctx.beginPath();
      ctx.ellipse(x, ROAD_TOP + 35, 240, 50, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let x = -300 + mistOffset2; x < width + 500; x += 500) {
      ctx.beginPath();
      ctx.ellipse(x, ROAD_TOP + 150, 280, 65, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Volumetric Headlight Cone punching through mist
    ctx.save();
    const beamWedge = ctx.createRadialGradient(
      heroScreenX + 38,
      heroY - 10,
      10,
      heroScreenX + 180,
      heroY - 10,
      240
    );
    beamWedge.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
    beamWedge.addColorStop(0.6, 'rgba(255, 255, 200, 0.15)');
    beamWedge.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctx.fillStyle = beamWedge;
    ctx.beginPath();
    ctx.moveTo(heroScreenX + 38, heroY - 12);
    ctx.lineTo(heroScreenX + 340, heroY - 60);
    ctx.lineTo(heroScreenX + 340, heroY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
