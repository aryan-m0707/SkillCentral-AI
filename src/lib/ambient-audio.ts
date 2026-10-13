'use client';

/**
 * Web Audio Ambient Sound Synthesizer
 * Zero-asset audio synthesis: Rain, Ocean Waves, Campfire (Brown Noise)
 * Runs purely on the Web Audio API without downloading external audio files.
 */

export type AmbientSoundType = 'off' | 'rain' | 'ocean' | 'campfire';

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'off';
  private gainNode: GainNode | null = null;
  private masterGain = 0.5;
  private isMuted = false;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Create 5-second looping buffer of noise
  private createNoiseBuffer(type: 'white' | 'pink' | 'brown'): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white * 0.15;
      } else if (type === 'pink') {
        // Paul Kellet's filtered pink noise algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      } else if (type === 'brown') {
        // Brown/Red noise (integrated white noise)
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 0.6;
      }
    }
    return buffer;
  }

  public setSound(type: AmbientSoundType) {
    this.currentType = type;
    if (type === 'off') {
      this.stop();
      return;
    }
    this.play(type);
  }

  public setVolume(volume: number) {
    this.masterGain = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.ctx) {
      const effective = this.isMuted ? 0 : this.masterGain;
      this.gainNode.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.masterGain);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.masterGain;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
      } catch {}
      this.lfoNode = null;
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }
  }

  private play(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx) return;

    this.stop();

    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }

    const effectiveGain = this.isMuted ? 0 : this.masterGain;
    this.gainNode.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);

    if (type === 'rain') {
      // Pink noise + lowpass filter around 1200Hz
      const buffer = this.createNoiseBuffer('pink');
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      source.connect(filter);
      filter.connect(this.gainNode);
      source.start();

      this.noiseNode = source;
      this.filterNode = filter;
    } else if (type === 'ocean') {
      // Pink noise with an LFO oscillating the filter frequency for tidal swells
      const buffer = this.createNoiseBuffer('pink');
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      // LFO for wave swells (0.12 Hz = ~8.5s wave rhythm)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(this.gainNode);

      source.start();
      lfo.start();

      this.noiseNode = source;
      this.filterNode = filter;
      this.lfoNode = lfo;
    } else if (type === 'campfire') {
      // Brown noise + warm filter
      const buffer = this.createNoiseBuffer('brown');
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      source.connect(filter);
      filter.connect(this.gainNode);
      source.start();

      this.noiseNode = source;
      this.filterNode = filter;
    }
  }

  // Play gentle two-tone chime for completion
  public playChime() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.25); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(349.23, now); // F4 harmonic

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Chime playback error:', e);
    }
  }
}

// Singleton export
export const ambientAudio = new AmbientAudioEngine();
