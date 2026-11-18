/** Audio is opt-in and silent until an explicit user gesture. */
export class SoundEngine {
  constructor() { this.enabled = false; this.context = null; }
  async toggle() {
    this.enabled = !this.enabled;
    try {
      if (this.enabled && !this.context) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) { this.enabled = false; return false; }
        this.context = new Context();
        this.osc = this.context.createOscillator(); this.osc.type = 'sawtooth';
        this.filter = this.context.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 900;
        this.gain = this.context.createGain(); this.gain.gain.value = 0;
        this.osc.connect(this.filter).connect(this.gain).connect(this.context.destination); this.osc.start();
      }
      if (this.enabled) await this.context.resume(); else await this.context.suspend();
    } catch { this.enabled = false; }
    return this.enabled;
  }
  update(car, active) {
    if (!this.context || !this.enabled) return;
    const now = this.context.currentTime;
    this.osc.frequency.setTargetAtTime(60 + car.speed * 105, now, 0.05);
    this.gain.gain.setTargetAtTime(active && car.state === 'slotted' && car.speed > .1 ? .015 + car.throttle * .015 : 0, now, 0.05);
  }
  beep(go = false) {
    if (!this.context || !this.enabled) return;
    const o = this.context.createOscillator(), g = this.context.createGain(), now = this.context.currentTime;
    o.type = 'sine'; o.frequency.value = go ? 1047 : 698; o.connect(g).connect(this.context.destination);
    g.gain.setValueAtTime(.045, now); g.gain.exponentialRampToValueAtTime(.0001, now + .16);
    o.start(now); o.stop(now + .17); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  destroy() { this.context?.close(); }
}
