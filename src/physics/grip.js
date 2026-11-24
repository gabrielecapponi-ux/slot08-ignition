import { clamp } from '../core/math.js';

/** Arcade rear-axle dynamics: the guide pin follows the slot while the tail swings.
 * Identical parameters and integration for every car; releasing power recovers grip.
 * A short overload is recoverable. Sustained overload pulls the guide out. */
export function updateGrip(car, curvature, dt) {
  const highThrottle = clamp((car.throttle - .85) / .15, 0, 1);
  const speedLoad = clamp(((car.speed ?? 0) - .8) / 1.6, 0, 1);
  const powerLoss = 1 - car.setup.powerGripLoss * car.throttle - .055 * highThrottle ** 2 * speedLoad;
  car.gripRatio = car.lateralForce / (car.maxGrip * (car.surfaceGrip??1) * powerLoss);
  const target = Math.sign(curvature) * clamp((car.gripRatio - .62) / .91, 0, 1) * .56;
  const response = 1 - Math.exp(-dt / (car.throttle > .1 ? .18 : .14));
  car.driftAngle += (target - car.driftAngle) * response;
  car.skid = clamp((Math.abs(car.driftAngle) - .075) / .48, 0, 1);
  const recovery=clamp(((car.speed??0)-4.4)/1.8,0,1)*(1-car.throttle)**2;
  car.instability = clamp(car.instability + dt * (car.gripRatio > 1
    ? Math.min(2.8,(car.gripRatio - 1) * 1.05 + Math.max(0,car.gripRatio - 1.45)**2 * 2.8) * (car.setup.slideRate ?? 1)*(1-.6*recovery) : -3.2), 0, 1);
  car.skidSeconds += car.skid > .18 ? dt : 0;
  return car.instability >= 1 || car.gripRatio > 5.5;
}

/** Keep the front guide pin attached while the rear axle rotates outwards. */
export function bodyPose(pose, driftAngle = 0) {
  const angle = pose.angle + driftAngle, pivot = .105;
  return { x: pose.x + pivot * (pose.tx - Math.cos(angle)),
    y: pose.y + pivot * (pose.ty - Math.sin(angle)), z: pose.z, angle };
}
