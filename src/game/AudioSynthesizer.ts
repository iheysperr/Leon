/**
 * Procedural Web Audio Sound Synthesizer for Bangla Tesla: Dhaka Rickshaw Race
 * Generates realistic EV motor whining, dual bell chimes, turbo whooshes,
 * horns, collisions, and retro Dhaka synth beats without external asset dependencies.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private motorGain: GainNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private motorSubOsc: OscillatorNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;
  
  public isMuted: boolean = false;
  public isMusicMuted: boolean = false;
  private isMotorRunning: boolean = false;
  
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMusic(enable: boolean) {
    this.isMusicMuted = !enable;
    if (!enable && this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    } else if (enable && !this.musicInterval) {
      this.startBackgroundMusic();
    }
  }

  /**
   * Starts continuous electric vehicle motor sound
   */
  public startMotor() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMotorRunning) return;

    try {
      this.motorOsc = this.ctx.createOscillator();
      this.motorSubOsc = this.ctx.createOscillator();
      this.motorFilter = this.ctx.createBiquadFilter();
      this.motorGain = this.ctx.createGain();

      this.motorOsc.type = 'sawtooth';
      this.motorOsc.frequency.value = 65;

      this.motorSubOsc.type = 'triangle';
      this.motorSubOsc.frequency.value = 32.5;

      this.motorFilter.type = 'lowpass';
      this.motorFilter.frequency.value = 260;
      this.motorFilter.Q.value = 2.5;

      this.motorGain.gain.value = 0.08;

      this.motorOsc.connect(this.motorFilter);
      this.motorSubOsc.connect(this.motorFilter);
      this.motorFilter.connect(this.motorGain);
      this.motorGain.connect(this.masterGain);

      this.motorOsc.start();
      this.motorSubOsc.start();
      this.isMotorRunning = true;
    } catch {
      // motor start handled safely
    }
  }

  /**
   * Updates motor pitch and whine based on current speed (0..60+ km/h)
   */
  public updateMotor(speedKmh: number, isThrottle: boolean) {
    if (!this.ctx || !this.isMotorRunning || !this.motorOsc || !this.motorFilter || !this.motorGain) return;

    const baseFreq = 55 + Math.min(speedKmh, 90) * 4.5;
    const filterFreq = 180 + Math.min(speedKmh, 90) * 14 + (isThrottle ? 120 : 0);
    const volume = isThrottle ? Math.min(0.2, 0.05 + speedKmh * 0.002) : Math.min(0.08, 0.02 + speedKmh * 0.001);

    const now = this.ctx.currentTime;
    this.motorOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    if (this.motorSubOsc) {
      this.motorSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);
    }
    this.motorFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.motorGain.gain.setTargetAtTime(this.isMuted ? 0 : volume, now, 0.08);
  }

  public stopMotor() {
    if (!this.isMotorRunning) return;
    try {
      this.motorOsc?.stop();
      this.motorSubOsc?.stop();
      this.motorOsc?.disconnect();
      this.motorSubOsc?.disconnect();
      this.motorGain?.disconnect();
    } catch {
      // safe cleanup
    }
    this.isMotorRunning = false;
  }

  /**
   * Classic Double Bell Chime: "ট্রিং ট্রিং!"
   */
  public playBell() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const chime = (timeOffset: number, pitchMult: number = 1.0) => {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime + timeOffset;

      // Two brass chime frequencies
      [1860 * pitchMult, 2480 * pitchMult].forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.3);
      });
    };

    // "Tring" 1 then "Tring" 2
    chime(0, 1.0);
    chime(0.12, 1.08);
  }

  /**
   * Electric Turbo Nitro Boost: Rising frequency & filtered noise blast
   */
  public playBoost() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Upward synth glide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.5);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.6);

    // Procedural white noise whoosh
    this.playNoiseWhoosh(0.5, 0.25);
  }

  /**
   * Regenerative Braking Sound (energy recovery whine)
   */
  public playRegenHum() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Coin pickup chime (sparkling major 3rd/5th chime)
   */
  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [1318.51, 1760.0]; // E6, A6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const noteTime = t + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  /**
   * Battery Pickup (Electric plasma buzz & surge)
   */
  public playBattery() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  /**
   * Tea Stall Hot Cha (energizing sip/bell)
   */
  public playTea() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [659.25, 880, 1174.66]; // E5, A5, D6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const noteTime = t + idx * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  /**
   * Collision Impact (Sub-bass thud + crunch)
   */
  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.28);

    // Noise crunch
    this.playNoiseWhoosh(0.2, 0.35);
  }

  /**
   * Pothole bump / spring suspension bounce
   */
  public playBump() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Water Splash & Hydroplane
   */
  public playSplash() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.playNoiseWhoosh(0.28, 0.22, 1200);
  }

  /**
   * Vehicle Horn (Dhaka bus / CNG beep)
   */
  public playHorn(isBus: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = isBus ? [185, 220] : [370, 440];
    const duration = isBus ? 0.35 : 0.18;

    freqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isBus ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  /**
   * Race Win fanfare
   */
  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.28, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  /**
   * Dhaka Monsoon Thunder Crack & Rumble
   */
  public playThunder() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(80, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 1.2);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, t);
    subFilter.frequency.exponentialRampToValueAtTime(45, t + 1.2);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 1.5);

    // Filtered thunder crackle noise
    this.playNoiseWhoosh(1.2, 0.4, 300);
  }

  /**
   * Distant Muffled Fog Horn
   */
  public playFogHorn() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.3);
    gain.gain.setValueAtTime(0.18, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.9);
  }

  private playNoiseWhoosh(duration: number, volume: number, cutoff: number = 800) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {
      // safe fallback
    }
  }

  /**
   * Procedural Dhaka Cyberpunk Folk Groove:
   * Upbeat 128 BPM electronic percussion + bass arpeggio
   */
  public startBackgroundMusic() {
    if (this.musicInterval || this.isMusicMuted) return;
    this.musicStep = 0;

    const bassNotes = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98]; // A2 pentatonic minor
    const melodyNotes = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392];

    const stepDurationMs = 125; // 16th note at ~120 BPM

    this.musicInterval = window.setInterval(() => {
      if (this.isMusicMuted || !this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Kick drum on 0, 4, 8, 12
      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.1);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.14);
      }

      // Synth bassline
      const bassFreq = bassNotes[(step >> 1) % bassNotes.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t);

      bassGain.gain.setValueAtTime(0.07, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.masterGain!);
      bassOsc.start(t);
      bassOsc.stop(t + 0.12);

      // Cyber bell melody on offbeats
      if (step % 2 === 1 && Math.random() > 0.3) {
        const melFreq = melodyNotes[(step + 2) % melodyNotes.length];
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melFreq, t);
        melGain.gain.setValueAtTime(0.05, t);
        melGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        melOsc.connect(melGain);
        melGain.connect(this.masterGain!);
        melOsc.start(t);
        melOsc.stop(t + 0.18);
      }

      this.musicStep++;
    }, stepDurationMs);
  }

  public stopBackgroundMusic() {
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new AudioSynthesizer();
