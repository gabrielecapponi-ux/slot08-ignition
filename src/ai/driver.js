import { planSpeed } from './line-planner.js';
import { PHYSICS } from '../core/config.js';
import { clamp } from '../core/math.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}

/** Rivals only produce the same throttle/lane inputs as the human.
 * No teleporting, rank-dependent speed, extra grip, or scripted crashes.
 * Reactions and mistaken corner estimates are seeded for reproducible races. */
export class AIDriver {
  constructor(track, pace = .88, { reaction = 0, errorRate = 0, seed = 8, tactical = false } = {}) {
    this.track = track; this.pace = pace; this.reaction = reaction; this.errorRate = errorRate;
    this.random = seededRandom(seed); this.tactical = tactical;
    this.throttle = 0; this.thinkIn = 0; this.errorTime = 0; this.errorBoost = 0;
    this.inCorner = false; this.lastGate = -1;
  }
  input(car, dt = PHYSICS.fixedStep, cars = []) {
    if (car.state !== 'slotted') { this.throttle = 0; this.thinkIn = this.reaction; this.errorTime = 0; return { throttle: 0, switchLane: false }; }
    const corner = Math.abs(car.pose?.curvature || 0) > .13;
    if (corner && !this.inCorner && this.random() < this.errorRate) {
      // An optimistic estimate lasts until the driver recognises the slide.
      this.errorTime = .65 + this.random() * .55;
      this.errorBoost = .18 + this.random() * .22;
    }
    this.inCorner = corner; this.errorTime = Math.max(0, this.errorTime - dt);
    this.thinkIn -= dt;
    let switchLane = false;
    if (this.thinkIn <= 0) {
      this.thinkIn = this.reaction * (.8 + this.random() * .4);
      const pace = this.pace + (this.errorTime > 0 ? this.errorBoost : 0);
      const target = planSpeed(this.track, car, pace);
      car.targetSpeed = target;
      this.throttle = car.speed < target - .06 ? 1 : car.speed > target + .03 ? 0 : clamp(.48 + (target - car.speed) * 4, 0, 1);
      // Recovery is a throttle decision, never an override of the physics.
      if (car.instability > .92) this.throttle = 0;
      if (this.tactical && !car.change && !car.switchQueued) {
        const ahead = this.track.nextSwitchDistance(car.distance);
        const gateKey = Math.round((car.distance + ahead) * 10);
        if (ahead < 1.8 && gateKey !== this.lastGate) {
          this.lastGate = gateKey;
          const nearby = cars.some(other => other !== car && other.lane === car.lane && other.state === 'slotted' && other.distance - car.distance > 0 && other.distance - car.distance < 1.2);
          switchLane = nearby || this.random() < .25;
        }
      }
    }
    return { throttle: this.throttle, switchLane };
  }
}
