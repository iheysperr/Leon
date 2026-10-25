/**
 * Bangla Tesla Sprite & Vehicle Art Engine
 * High-definition procedural canvas rendering for the Bangla Tesla,
 * rival rickshaws, CNGs, Dhaka buses, pedestrians, and interactive pickups.
 */

import { RickshawSkin } from '../types/game';

export const SKINS: Record<string, RickshawSkin> = {
  tesla: {
    id: 'tesla',
    name: 'Cyberpunk Tesla',
    nameBn: 'সাইবার টেসলা',
    bodyColor: '#e0e5ec',
    accentColor: '#00e5ff',
    glowColor: '#00e5ff',
    hoodPattern: 'cyber',
    hoodArtText: 'TESLA 2077',
    neonUnderglow: true,
    unlockedByDefault: true,
  },
  peacock: {
    id: 'peacock',
    name: 'Royal Peacock',
    nameBn: 'ময়ূরপঙ্খী',
    bodyColor: '#0984e3',
    accentColor: '#fdcb6e',
    glowColor: '#00cec9',
    hoodPattern: 'peacock',
    hoodArtText: 'ময়ূরপঙ্খী',
    neonUnderglow: true,
    unlockedByDefault: true,
  },
  redfairy: {
    id: 'redfairy',
    name: 'Red Fairy',
    nameBn: 'লাল পরী',
    bodyColor: '#d63031',
    accentColor: '#ffeaa7',
    glowColor: '#ff7675',
    hoodPattern: 'racing',
    hoodArtText: 'লাল পরী',
    neonUnderglow: true,
    unlockedByDefault: false,
    requiredTier: 3,
  },
  solar: {
    id: 'solar',
    name: 'Solar Apex',
    nameBn: 'সোলার অ্যাপেক্স',
    bodyColor: '#f1c40f',
    accentColor: '#2c3e50',
    glowColor: '#f39c12',
    hoodPattern: 'solar',
    hoodArtText: 'SOLAR 100%',
    neonUnderglow: true,
    unlockedByDefault: false,
    requiredTier: 5,
  },
  shadow: {
    id: 'shadow',
    name: 'Dhaka Shadow',
    nameBn: 'ঢাকা শ্যাডো',
    bodyColor: '#2d3436',
    accentColor: '#e84393',
    glowColor: '#fd79a8',
    hoodPattern: 'gold',
    hoodArtText: 'SHADOW EV',
    neonUnderglow: true,
    unlockedByDefault: false,
    requiredTier: 8,
  },
};

export class RickshawArt {
  /**
   * Renders the hero or rival electric rickshaw at world position (x, y)
   */
  public static drawRickshaw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    skin: RickshawSkin,
    speedKmh: number,
    wheelAngle: number,
    suspensionOffset: number,
    leanAngle: number,
    isBoosting: boolean,
    isBraking: boolean,
    isFlatBattery: boolean,
    nameTag?: string
  ) {
    ctx.save();
    ctx.translate(x, y + suspensionOffset);
    ctx.rotate(leanAngle);

    // 1. Neon Underglow on Asphalt
    if (skin.neonUnderglow) {
      ctx.save();
      const underglowGrad = ctx.createRadialGradient(0, 10, 8, 0, 10, 48);
      underglowGrad.addColorStop(0, skin.glowColor);
      underglowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = underglowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 10, 52, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Headlight Beam casting forward
    ctx.save();
    const beamGrad = ctx.createLinearGradient(40, -10, 220, -10);
    beamGrad.addColorStop(0, 'rgba(255, 255, 220, 0.5)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(38, -12);
    ctx.lineTo(240, -38);
    ctx.lineTo(240, 22);
    ctx.lineTo(38, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Rear Chassis Frame & Wheels
    // Rear left wheel
    this.drawWheel(ctx, -26, 6, 17, wheelAngle);
    // Rear right wheel
    this.drawWheel(ctx, 4, 6, 17, wheelAngle);

    // Frame tubes (triangular rickshaw chassis)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.lineTo(10, 4);
    ctx.lineTo(34, -14); // front fork
    ctx.lineTo(18, -18); // seat pillar
    ctx.lineTo(-28, 4);
    ctx.stroke();

    // 4. Passenger Carriage / Hood (Rickshaw Hood)
    ctx.save();
    // Canopy Shell
    ctx.fillStyle = skin.bodyColor;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-44, -28);
    ctx.quadraticCurveTo(-42, -54, -14, -54);
    ctx.quadraticCurveTo(12, -54, 14, -30);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Canopy Art / Pattern
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(-14, -40, 10, 0, Math.PI * 2);
    ctx.fill();

    // Traditional Rickshaw Floral / Cyber Decal lines
    ctx.strokeStyle = skin.accentColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-36, -20);
    ctx.quadraticCurveTo(-14, -34, 8, -20);
    ctx.stroke();

    // Rickshaw Plate Art text on back
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(skin.hoodArtText || 'BANGLA TESLA', -14, -12);

    // Hanging tassels / pom-poms on canopy edge
    const tasselSway = Math.sin(wheelAngle * 2) * 4;
    ctx.fillStyle = skin.glowColor;
    for (let tx = -38; tx <= 10; tx += 12) {
      ctx.beginPath();
      ctx.arc(tx, -4 + tasselSway * 0.4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Battery Pack & Electric Motor Housing
    ctx.fillStyle = '#2d3436';
    ctx.strokeStyle = skin.glowColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-12, -4, 20, 10);
    ctx.strokeRect(-12, -4, 20, 10);

    // Battery LED glow indicator
    ctx.fillStyle = isFlatBattery ? '#ff7675' : '#00b894';
    ctx.fillRect(-8, -2, 12, 4);

    // 6. Front Fork & Front Wheel
    this.drawWheel(ctx, 38, 4, 18, wheelAngle);

    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(38, 4);
    ctx.lineTo(34, -28); // Handlebar stem
    ctx.stroke();

    // Handlebar & Bell
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, -30);
    ctx.lineTo(38, -28);
    ctx.stroke();

    // Chrome Brass Bell
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(33, -32, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front Headlight housing
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(36, -22, 6, 6);
    ctx.fillStyle = skin.glowColor;
    ctx.fillRect(41, -21, 2, 4);

    // 7. Driver (Rider) Figure
    this.drawRider(ctx, 16, -18, wheelAngle, isFlatBattery);

    // 8. Turbo Boost Sparks or Brake lights
    if (isBoosting) {
      this.drawBoostThruster(ctx, -42, -4, skin.glowColor);
    }
    if (isBraking) {
      ctx.fillStyle = '#ff3838';
      ctx.shadowColor = '#ff3838';
      ctx.shadowBlur = 10;
      ctx.fillRect(-44, -14, 4, 8);
      ctx.shadowBlur = 0;
    }

    // Name tag for multiplayer/rivals
    if (nameTag) {
      ctx.fillStyle = 'rgba(15, 10, 30, 0.85)';
      ctx.fillRect(-35, -74, 70, 16);
      ctx.strokeStyle = skin.glowColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(-35, -74, 70, 16);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(nameTag, 0, -62);
    }

    ctx.restore();
  }

  /**
   * Renders the Personal Record Ghost Shadow as a translucent cyber hologram
   */
  public static drawGhostShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    wheelAngle: number,
    leanAngle: number,
    isBoosting: boolean,
    timeSec: number,
    deltaMetersText?: string
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leanAngle);

    // Holographic pulsing transparency
    const pulse = 0.45 + Math.sin(timeSec * 7) * 0.12;
    ctx.globalAlpha = pulse;

    // 1. Cyan holographic ground aura
    ctx.save();
    const auraGrad = ctx.createRadialGradient(0, 10, 5, 0, 10, 50);
    auraGrad.addColorStop(0, 'rgba(0, 242, 254, 0.55)');
    auraGrad.addColorStop(0.7, 'rgba(79, 172, 254, 0.2)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 56, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Wheels
    this.drawWheel(ctx, -26, 6, 17, wheelAngle);
    this.drawWheel(ctx, 4, 6, 17, wheelAngle);
    this.drawWheel(ctx, 38, 4, 18, wheelAngle);

    // 3. Cyber Hologram Frame & Chassis
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f2fe';
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.lineTo(10, 4);
    ctx.lineTo(34, -14);
    ctx.lineTo(18, -18);
    ctx.lineTo(-28, 4);
    ctx.stroke();

    // 4. Canopy Shell & Digital Scanlines
    ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-44, -28);
    ctx.quadraticCurveTo(-42, -54, -14, -54);
    ctx.quadraticCurveTo(12, -54, 14, -30);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scanlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let sy = -50; sy < -5; sy += 7) {
      ctx.beginPath();
      ctx.moveTo(-38, sy);
      ctx.lineTo(10, sy);
      ctx.stroke();
    }

    // 5. Rider Silhouette
    ctx.fillStyle = 'rgba(79, 172, 254, 0.5)';
    ctx.fillRect(13, -38, 11, 20);
    ctx.beginPath();
    ctx.arc(19, -44, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Handlebars
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(38, 4);
    ctx.lineTo(34, -28);
    ctx.stroke();

    if (isBoosting) {
      this.drawBoostThruster(ctx, -42, -4, '#00f2fe');

      // Holographic speed echoes trailing ghost shadow
      ctx.save();
      ctx.globalAlpha = pulse * 0.35;
      ctx.translate(-24, 0);
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.moveTo(-38, 2);
      ctx.lineTo(-44, -28);
      ctx.quadraticCurveTo(-42, -54, -14, -54);
      ctx.quadraticCurveTo(12, -54, 14, -30);
      ctx.lineTo(12, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 7. Floating Digital Telemetry Badge above Ghost
    ctx.save();
    ctx.translate(x, y - 72);
    ctx.fillStyle = 'rgba(10, 20, 40, 0.88)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-50, -11, 100, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(deltaMetersText || '⚡ PB SHADOW', 0, 4);
    ctx.restore();
  }

  private static drawWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    angle: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Tire rubber
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Rim inner
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.arc(0, 0, r - 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Alloy/Spoke lines rotating with speed
    ctx.strokeStyle = '#ced6e0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 4;
      ctx.moveTo(-Math.cos(a) * (r - 4), -Math.sin(a) * (r - 4));
      ctx.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    }
    ctx.stroke();

    // Hub cap
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawRider(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    isPedaling: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Torso (Bengali checked lungi / Cyber racing vest)
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(-3, -22, 11, 20);

    // Driver's Head
    ctx.fillStyle = '#c7926b'; // complexion
    ctx.beginPath();
    ctx.arc(3, -28, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Scarf (Gamcha)
    ctx.fillStyle = '#d63031';
    ctx.fillRect(-2, -34, 10, 4);

    // Arms holding handlebars
    ctx.strokeStyle = '#c7926b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, -18);
    ctx.lineTo(18, -12);
    ctx.stroke();

    // Legs / Pedaling motion
    const pedalCadence = isPedaling ? Math.sin(angle) * 8 : 0;
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(10 + pedalCadence, 8);
    ctx.stroke();

    ctx.restore();
  }

  public static drawBoostThruster(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    glowColor: string = '#00f2fe'
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Dynamic flame flicker lengths
    const flameLen = 28 + Math.random() * 16;
    const flameWidth = 7 + Math.random() * 2.5;

    // 1. Outer Neon Plasma Cone Flare
    const gradOuter = ctx.createLinearGradient(0, 0, -flameLen * 1.25, 0);
    gradOuter.addColorStop(0, '#ff007f'); // magenta base transition
    gradOuter.addColorStop(0.35, glowColor);
    gradOuter.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.fillStyle = gradOuter;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.moveTo(2, -flameWidth);
    ctx.quadraticCurveTo(-flameLen * 0.45, -flameWidth * 1.3, -flameLen * 1.25, 0);
    ctx.quadraticCurveTo(-flameLen * 0.45, flameWidth * 1.3, 2, flameWidth);
    ctx.closePath();
    ctx.fill();

    // 2. High-energy electric core
    const gradInner = ctx.createLinearGradient(0, 0, -flameLen * 0.7, 0);
    gradInner.addColorStop(0, '#ffffff');
    gradInner.addColorStop(0.5, glowColor);
    gradInner.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradInner;

    ctx.beginPath();
    ctx.moveTo(2, -flameWidth * 0.45);
    ctx.lineTo(-flameLen * 0.7, 0);
    ctx.lineTo(2, flameWidth * 0.45);
    ctx.closePath();
    ctx.fill();

    // 3. Supersonic Mach / Shock Diamonds
    ctx.fillStyle = '#ffffff';
    for (let d = 1; d <= 3; d++) {
      const dx = -d * (flameLen * 0.22);
      const dw = 3.2 - d * 0.7;
      ctx.beginPath();
      ctx.moveTo(dx, -dw);
      ctx.lineTo(dx - 3, 0);
      ctx.lineTo(dx, dw);
      ctx.lineTo(dx + 3, 0);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Secondary Auxiliary Micro-Jets (Dual exhaust manifold)
    ctx.fillStyle = 'rgba(0, 242, 254, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-12 - Math.random() * 6, -11);
    ctx.lineTo(0, -7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-12 - Math.random() * 6, 9);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders a glowing speed silhouette / after-image of the Bangla Tesla
   */
  public static drawBoostAfterImage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    leanAngle: number,
    alpha: number,
    color: string = '#00f2fe'
  ) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leanAngle);
    ctx.globalAlpha = alpha;

    // Glowing Rickshaw Canopy silhouette
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(-38, 2);
    ctx.lineTo(-44, -28);
    ctx.quadraticCurveTo(-42, -54, -14, -54);
    ctx.quadraticCurveTo(12, -54, 14, -30);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();

    // Rider silhouette
    ctx.beginPath();
    ctx.arc(19, -44, 6.5, 0, Math.PI * 2);
    ctx.rect(13, -38, 11, 20);
    ctx.fill();

    // Frame tubes stroke
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.lineTo(10, 4);
    ctx.lineTo(34, -14);
    ctx.lineTo(18, -18);
    ctx.lineTo(-28, 4);
    ctx.moveTo(38, 4);
    ctx.lineTo(34, -28);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * CNG Auto-Rickshaw (Dhaka iconic green three-wheeler)
   */
  public static drawCNG(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    wheelAngle: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    this.drawWheel(ctx, -24, 8, 14, wheelAngle);
    this.drawWheel(ctx, 24, 8, 14, wheelAngle);

    // Body (Green Auto-Rickshaw)
    ctx.fillStyle = '#009432';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-36, 6);
    ctx.lineTo(-36, -26);
    ctx.lineTo(8, -26);
    ctx.lineTo(34, -4);
    ctx.lineTo(34, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Yellow / Black Canvas Roof
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-38, -32, 48, 6);

    // Wire Mesh safety grille
    ctx.strokeStyle = '#bdc581';
    ctx.lineWidth = 1;
    ctx.strokeRect(-20, -22, 22, 14);

    // Headlight
    ctx.fillStyle = '#fff4cc';
    ctx.fillRect(32, -8, 4, 6);

    ctx.restore();
  }

  /**
   * Dhaka Murir Tin Bus (Colorful Local Bus)
   */
  public static drawBus(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    wheelAngle: number,
    colorHex: string = '#d63031'
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 75, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    this.drawWheel(ctx, -46, 12, 18, wheelAngle);
    this.drawWheel(ctx, 46, 12, 18, wheelAngle);

    // Bus Body
    ctx.fillStyle = colorHex;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(-68, -48, 136, 56, 6);
    ctx.fill();
    ctx.stroke();

    // Bus Stripe
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-68, -18, 136, 8);

    // Windows with silhouettes
    ctx.fillStyle = '#74b9ff';
    for (let wx = -58; wx <= 34; wx += 22) {
      ctx.fillRect(wx, -40, 16, 16);
      // Passenger head silhouette
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(wx + 8, -30, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#74b9ff';
    }

    // Windshield
    ctx.fillStyle = '#81ecec';
    ctx.fillRect(48, -42, 16, 22);

    // Roof luggage rack
    ctx.strokeStyle = '#636e72';
    ctx.lineWidth = 2;
    ctx.strokeRect(-60, -56, 110, 8);

    // Headlight
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(66, -12, 4, 8);

    ctx.restore();
  }

  /**
   * Dhaka Pedestrian (Walking jaywalker)
   */
  public static drawPerson(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    walkCycle: number,
    hasUmbrella: boolean = false
  ) {
    ctx.save();
    ctx.translate(x, y);

    const legSwing = Math.sin(walkCycle) * 8;

    // Legs
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(legSwing, 6);
    ctx.moveTo(0, -10);
    ctx.lineTo(-legSwing, 6);
    ctx.stroke();

    // Body / Panjabi shirt
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(-5, -28, 10, 18);

    // Head
    ctx.fillStyle = '#d49b73';
    ctx.beginPath();
    ctx.arc(0, -33, 5, 0, Math.PI * 2);
    ctx.fill();

    // Umbrella in rain
    if (hasUmbrella) {
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, -24);
      ctx.lineTo(3, -42);
      ctx.stroke();

      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(3, -42, 14, Math.PI, 0, false);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Pothole Decal
   */
  public static drawPothole(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#0a0712';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cracked edges
    ctx.strokeStyle = '#1f1930';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-30, -3);
    ctx.moveTo(22, 0);
    ctx.lineTo(29, 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Monsoon Water Puddle Decal
   */
  public static drawPuddle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timeSec: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Puddle water body reflecting neon
    const puddleGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    puddleGrad.addColorStop(0, 'rgba(40, 70, 110, 0.4)');
    puddleGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.25)');
    puddleGrad.addColorStop(1, 'rgba(40, 70, 110, 0.4)');

    ctx.fillStyle = puddleGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water ripple ring
    const ringR = ((timeSec * 25) % 30);
    ctx.strokeStyle = `rgba(180, 230, 255, ${Math.max(0, 1 - ringR / 30) * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Collectible Gold Taka Coin
   */
  public static drawCoin(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    spinAngle: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    const scaleX = Math.cos(spinAngle);

    ctx.scale(scaleX, 1);
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bengali Taka Symbol ৳
    ctx.fillStyle = '#d35400';
    ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('৳', 0, 1);

    ctx.restore();
  }

  /**
   * Collectible Lithium Battery Pack (+Energy)
   */
  public static drawBattery(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pulse: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    const s = 1 + Math.sin(pulse * 6) * 0.08;
    ctx.scale(s, s);

    ctx.fillStyle = '#00b894';
    ctx.strokeStyle = '#55efc4';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00cec9';
    ctx.shadowBlur = 12;

    ctx.fillRect(-10, -14, 20, 28);
    ctx.strokeRect(-10, -14, 20, 28);

    // Terminal nub
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(-4, -18, 8, 4);

    // Lightning bolt icon
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath();
    ctx.moveTo(1, -9);
    ctx.lineTo(-4, 0);
    ctx.lineTo(2, 0);
    ctx.lineTo(-1, 9);
    ctx.lineTo(4, -1);
    ctx.lineTo(-1, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Turbo Boost Nitro Canister
   */
  public static drawBoostItem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pulse: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    const s = 1 + Math.sin(pulse * 8) * 0.09;
    ctx.scale(s, s);

    ctx.fillStyle = '#e056fd';
    ctx.strokeStyle = '#ff7979';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#e056fd';
    ctx.shadowBlur = 14;

    ctx.fillRect(-9, -15, 18, 30);
    ctx.strokeRect(-9, -15, 18, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡N2O', 0, 3);

    ctx.restore();
  }

  /**
   * Steaming Hot Tea Cup (Stamina / Focus)
   */
  public static drawTeaItem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timeSec: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Cup
    ctx.fillStyle = '#e17055';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(10, -8);
    ctx.lineTo(7, 10);
    ctx.lineTo(-7, 10);
    ctx.closePath();
    ctx.fill();

    // Hot tea liquid
    ctx.fillStyle = '#6c5ce7';
    ctx.fillRect(-8, -8, 16, 2);

    // Rising steam curls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    const steamY = ((timeSec * 20) % 15);
    ctx.beginPath();
    ctx.moveTo(-3, -10 - steamY);
    ctx.quadraticCurveTo(0, -15 - steamY, -2, -20 - steamY);
    ctx.stroke();

    ctx.restore();
  }
}
