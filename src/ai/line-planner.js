import { surfaceGrip } from '../track/conditions.js';
import { safeSpeed } from '../physics/engine.js';
import { PHYSICS } from '../core/config.js';

/** Braking envelope along the actual lane, including a queued crossover. */
export function planSpeed(track, car, pace = .88) {
  const cfg = car.setup || PHYSICS;
  const braking = (cfg.engineBrake + cfg.rollingResistance) / cfg.mass;
  let target = cfg.maxSpeed * .95;
  const lookahead = Math.max(2, car.speed ** 2 / (2 * braking) + 1);
  let change = car.change;
  if (!change && car.switchQueued) {
    const ahead = track.nextSwitchDistance(car.distance);
    const gate = track.switches.find(g => Math.abs(((g.start - track.sample(car.distance).s + track.length) % track.length) - ahead) < .001);
    if (gate) change = { from: car.lane, to: track.switchTarget?.(gate,car.lane)??1-car.lane, start: car.distance + ahead, length: gate.end - gate.start };
  }
  for (let ahead = 0; ahead <= lookahead; ahead += .10) {
    const p = track.pose(car.distance + ahead, car.lane, change);
    const limit = safeSpeed(p.curvature, car.maxGrip * surfaceGrip(track,car.distance+ahead,change?null:car.lane,cfg) * (1 - cfg.powerGripLoss * .55),p.bank||0) * pace;
    const elevationGain=p.z-(car.pose?.z??p.z);
    const approachLimit=limit**2+2*(braking*ahead*.78+PHYSICS.gravity*elevationGain);
    target=Math.min(target,Math.sqrt(Math.max(limit**2*.70,approachLimit)));
  }
  return target;
}
