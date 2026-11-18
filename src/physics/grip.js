import { clamp } from '../core/math.js';

/** Arcade rear-axle dynamics: the guide pin follows the slot while the tail swings.
 * Identical parameters and integration for every car; releasing power recovers grip.
 * A short overload is recoverable. Sustained overload pulls the guide out. */
export function updateGrip(car, curvature, dt) {
  const powerLoss = 1 - car.setup.powerGripLoss * car.throttle;
  car.gripRatio = car.lateralForce / (car.maxGrip * powerLoss);
  const target = Math.sign(curvature) * clamp((car.gripRatio - .60) / .65, 0, 1) * .64;
  const response = 1 - Math.exp(-dt / (car.throttle > .1 ? .085 : .13));
  car.driftAngle += (target - car.driftAngle) * response;
  car.skid = clamp((Math.abs(car.driftAngle) - .075) / .48, 0, 1);
  car.instability = clamp(car.instability + dt * (car.gripRatio > 1
    ? (car.gripRatio - 1) * 5.5 : -2.4), 0, 1);
  car.skidSeconds += car.skid > .18 ? dt : 0;
  return car.instability >= 1 || car.gripRatio > 2.8;
}

/** Keep the front guide pin attached while the rear axle rotates outwards. */
export function bodyPose(pose, driftAngle = 0) {
  const angle = pose.angle + driftAngle, pivot = .105;
  return { x: pose.x + pivot * (pose.tx - Math.cos(angle)),
    y: pose.y + pivot * (pose.ty - Math.sin(angle)), z: pose.z, angle };
}
