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
        this.squeal = this.context.createOscillator(); this.squeal.type = 'triangle';
        this.squealGain = this.context.createGain(); this.squealGain.gain.value = 0;
        this.squeal.connect(this.squealGain).connect(this.context.destination); this.squeal.start();
        const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const samples = buffer.getChannelData(0); for (let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
        this.rubber = this.context.createBufferSource(); this.rubber.buffer=buffer; this.rubber.loop=true;
        const band=this.context.createBiquadFilter(); band.type='bandpass'; band.frequency.value=1800; band.Q.value=.7;
        this.rubberGain=this.context.createGain(); this.rubberGain.gain.value=0;
        this.rubber.connect(band).connect(this.rubberGain).connect(this.context.destination); this.rubber.start();
      }
      if (this.enabled) await this.context.resume(); else await this.context.suspend();
    } catch { this.enabled = false; }
    return this.enabled;
  }
  update(car, active) {
    if (!this.context || !this.enabled) return;
    const now = this.context.currentTime;
    const skid = active && car.state === 'slotted' ? car.skid : 0;
    this.squeal.frequency.setTargetAtTime(850 + skid * 500, now, .06);
    this.squealGain.gain.setTargetAtTime(skid * .017, now, .04);
    this.rubberGain.gain.setTargetAtTime(skid * .035, now, .04);
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
