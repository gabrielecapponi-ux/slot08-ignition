import { PHYSICS } from './config.js';

/** Bounded fixed-step accumulator. Rendering never changes physics dt. */
export class FixedLoop {
  constructor(update, render) { this.update = update; this.render = render; this.accumulator = 0; this.last = null; this.id = 0; this.renderInterval=0;this.renderAccumulator=0; }
  setRenderRate(fps){this.renderInterval=1/Math.max(30,Math.min(120,Number(fps)||120));}
  frame = now => {
    const delta = this.last === null ? 0 : Math.min((now - this.last) / 1000, PHYSICS.maxFrameTime);
    this.last = now;
    this.accumulator += Math.max(0, delta);
    while (this.accumulator >= PHYSICS.fixedStep) {
      this.update(PHYSICS.fixedStep);
      this.accumulator -= PHYSICS.fixedStep;
    }
    this.renderAccumulator+=Math.max(0,delta);
    if(!this.renderInterval||this.renderAccumulator+1e-8>=this.renderInterval||delta===0){
      this.render(this.accumulator / PHYSICS.fixedStep, now / 1000);
      if(this.renderInterval)this.renderAccumulator=Math.max(0,this.renderAccumulator-Math.floor((this.renderAccumulator+1e-8)/this.renderInterval)*this.renderInterval);
    }
    this.id = requestAnimationFrame(this.frame);
  };
  start() { if (!this.id) this.id = requestAnimationFrame(this.frame); }
  resetClock() { this.last = null; this.accumulator = 0; this.renderAccumulator=0; }
  stop() { cancelAnimationFrame(this.id); this.id = 0; this.resetClock(); }
}
