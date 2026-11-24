import { trafficAhead, passingLaneClear, laneGap } from '../game/club.js';
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
      this.errorTime = .35 + this.random() * .55;
      this.errorBoost = .14 + this.random() * .20;
    }
    this.inCorner = corner; this.errorTime = Math.max(0, this.errorTime - dt);
    this.thinkIn -= dt;
    let switchLane = false;
    if (this.thinkIn <= 0) {
      this.thinkIn = this.reaction * (.8 + this.random() * .4);
      const pace = this.pace + (this.errorTime > 0 ? this.errorBoost : 0);
      let target = planSpeed(this.track, car, pace);
      // A rival brakes through its throttle input; there is no speed clamp on a human car.
      const gap=trafficAhead(this.track,car,cars);
      if(gap<1.4 && this.errorTime<=0){
        const leader=cars.find(c=>c!==car&&c.state==='slotted'&&(c.lane===car.lane||c.change?.to===car.lane)&&Math.abs(laneGap(this.track,car,c)-gap)<.02);
        if(leader)target=Math.min(target,Math.max(0,leader.speed+(gap-.38)*2.0));
      }
      let blocked=false;
      if(this.tactical){
        const p=car.pose;
        for(const other of cars){
          const wreck=other.crash;if(!wreck||other.state!=='derailed'||Math.abs(wreck.z-p.z-.077)>.20)continue;
          const dx=wreck.x-p.x,dy=wreck.y-p.y,forward=dx*p.tx+dy*p.ty;
          if(forward<=0||forward>Math.min(2.8,.48+car.speed*.58)||Math.abs(dx*p.ty-dy*p.tx)>.16)continue;
          blocked=true;
          const decel=(car.setup.engineBrake+car.setup.rollingResistance)/car.setup.mass;
          target=Math.min(target,Math.sqrt(2*decel*Math.max(0,forward-.34)));
        }
      }
      car.targetSpeed = target;
      this.throttle = car.speed < target - .06 ? 1 : car.speed > target + .03 ? 0 : clamp(.48 + (target - car.speed) * 4, 0, 1);
      // Recovery is a throttle decision, never an override of the physics.
      if (car.instability > .92) this.throttle = 0;
      if (this.tactical && !car.change && !car.switchQueued) {
        const ahead = this.track.nextSwitchDistance(car.distance);
        const gateKey = Math.round((car.distance + ahead) * 10);
        if (ahead < 1.8 && gateKey !== this.lastGate) {
          switchLane=(blocked||gap<2.8) && passingLaneClear(this.track,car,cars);
          if(switchLane)this.lastGate=gateKey;

        }
      }
    }
    return { throttle: this.throttle, switchLane };
  }
}
