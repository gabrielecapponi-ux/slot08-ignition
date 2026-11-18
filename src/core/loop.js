import { PHYSICS } from './config.js';

/** Bounded fixed-step accumulator. Rendering never changes physics dt. */
export class FixedLoop {
  constructor(update, render) { this.update = update; this.render = render; this.accumulator = 0; this.last = null; this.id = 0; }
  frame = now => {
    const delta = this.last === null ? 0 : Math.min((now - this.last) / 1000, PHYSICS.maxFrameTime);
    this.last = now;
    this.accumulator += Math.max(0, delta);
    while (this.accumulator >= PHYSICS.fixedStep) {
      this.update(PHYSICS.fixedStep);
      this.accumulator -= PHYSICS.fixedStep;
    }
    this.render(this.accumulator / PHYSICS.fixedStep, now / 1000);
    this.id = requestAnimationFrame(this.frame);
  };
  start() { if (!this.id) this.id = requestAnimationFrame(this.frame); }
  resetClock() { this.last = null; this.accumulator = 0; }
  stop() { cancelAnimationFrame(this.id); this.id = 0; this.resetClock(); }
}
