
// Audio System using Web Audio API (No external files required)

class GameAudio {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  enabled: boolean = true;

  constructor() {
    try {
      // Safely check for AudioContext presence
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.3; // Master volume
          this.masterGain.connect(this.ctx.destination);
        }
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Could not resume audio", e));
    }
  }

  // Generic tone generator
  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 1) {
    if (!this.ctx || !this.masterGain || !this.enabled) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors during rapid play
    }
  }

  playShoot() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  playHit() {
    // Short noise-like pop
    this.playTone(150, 'square', 0.05, 0.05);
  }

  playExplosion() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      
      // Create noise buffer
      const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      // Filter to make it sound like an explosion (low pass)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.frequency.linearRampToValueAtTime(100, t + 0.3);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      
      noise.start();
    } catch (e) {}
  }

  playUpgrade() {
    // Ascending chime
    const now = this.ctx?.currentTime || 0;
    this.playTone(440, 'sine', 0.3, 0.1); // A4
    setTimeout(() => this.playTone(554, 'sine', 0.3, 0.1), 100); // C#5
    setTimeout(() => this.playTone(659, 'sine', 0.4, 0.1), 200); // E5
  }

  playEmp() {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.5); // Rise
      osc.frequency.exponentialRampToValueAtTime(50, t + 1.5); // Drop

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(t + 1.5);
    } catch (e) {}
  }
}

export const audioSystem = new GameAudio();
