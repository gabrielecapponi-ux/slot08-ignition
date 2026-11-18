import { safeSpeed } from '../physics/engine.js';
import { PHYSICS } from '../core/config.js';

/** Coaching is information only. It never changes throttle or grip. Distances
 * are model metres; the recommended speed uses the HUD's 1:18 equivalent. */
export function brakingAdvice(track, car) {
  const cfg = car.setup || PHYSICS, braking = (cfg.engineBrake + cfg.rollingResistance) / cfg.mass * .78;
  const lookahead = Math.max(12, car.speed * 3), grip = car.maxGrip * (1 - cfg.powerGripLoss * .55);
  let best = null;
  for (let ahead = 0; ahead <= lookahead; ahead += .15) {
    const p = track.pose(car.distance + ahead, car.lane, car.change);
    if (Math.abs(p.curvature) < .06) continue;
    const limit = safeSpeed(p.curvature, grip) * .82;
    const distanceToBrake = ahead - Math.max(0, (car.speed ** 2 - limit ** 2) / (2 * braking)) - car.speed * .25;
    if (!best || distanceToBrake < best.distanceToBrake) best = { distance: ahead, distanceToBrake, limit, point: car.distance + ahead };
  }
  if (!best) return { action: 'go', label: 'ACCELERA · RETTILINEO LIBERO', distance: Infinity, distanceToBrake: Infinity, limit: cfg.maxSpeed, point: null };
  const tooFast = car.speed > best.limit + .1;
  const action = car.instability > .05 || tooFast && best.distanceToBrake <= .3 ? 'brake' : tooFast && best.distanceToBrake < car.speed * 1.25 ? 'prepare' : 'go';
  const speed = Math.round(best.limit * 3.6 * PHYSICS.modelScale);
  const label = action === 'brake' ? `RILASCIA ORA · CURVA A ${speed} KM/H` : action === 'prepare' ? `FRENA TRA ${Math.max(0,best.distanceToBrake).toFixed(1)} M · ${speed} KM/H` : best.distance < 1 ? 'CURVA · DOSA IL GAS' : `PROSSIMA CURVA · ${best.distance.toFixed(0)} M`;
  return { ...best, action, label };
}
