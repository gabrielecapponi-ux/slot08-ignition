import { PHYSICS } from '../core/config.js';
import { clamp } from '../core/math.js';
import { updateGrip, bodyPose } from './grip.js';

export const lateralDemand = (speed, curvature, mass = PHYSICS.mass) => mass * speed * speed * Math.abs(curvature);
export const safeSpeed = (curvature, force = PHYSICS.gripForce) => Math.abs(curvature) < 1e-9
  ? Infinity : Math.sqrt(force / (PHYSICS.mass * Math.abs(curvature)));

/** Pure simulation service: no DOM, renderer, clock or persistence dependency. */
export class PhysicsEngine {
  constructor(track) { this.track = track; }

  changeLane(car) {
    if (car.state !== 'slotted' || car.change || !this.track.switchAt(car.distance)) return false;
    const gate = this.track.switchAt(car.distance);
    const local = this.track.sample(car.distance).s;
    car.change = { from: car.lane, to: 1 - car.lane, start: car.distance, length: gate.end - local };
    return true;
  }

  derail(car, pose) {
    const body = bodyPose(pose, car.driftAngle);
    car.state = 'derailed'; car.recoverIn = PHYSICS.recoverySeconds; car.crashes++;
    car.crash = { x: body.x, y: body.y, z: pose.z + 0.077, vx: pose.tx * car.speed,
      vy: pose.ty * car.speed, vz: 0.42, angle: body.angle,
      spin: -Math.sign(pose.curvature || 1) * car.speed * 1.6, bridge: pose.bridge };
    // Keep centreline distance fixed: a crash cannot advance checkpoint/lap progress.
    // A crash in a switch returns to its original lane at the SAME position.
    car.change = null; car.switchQueued = false; car.speed = 0; car.throttle = 0; car.skid = 0;
  }

  step(car, throttle, dt) {
    if (car.finishedAt !== null) return null;
    if (car.state === 'derailed') {
      const c = car.crash;
      const fade = Math.exp(-PHYSICS.slideFriction * dt);
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.vx *= fade; c.vy *= fade;
      c.angle += c.spin * dt; c.spin *= fade;
      c.vz -= 9.81 * dt; c.z = Math.max(0, c.z + c.vz * dt);
      car.recoverIn = Math.max(0, car.recoverIn - dt);
      if (car.recoverIn <= 1e-8) {
        car.state = 'slotted'; car.crash = null; car.recoverIn = 0; car.gripRatio = 0; car.instability = 0; car.driftAngle = 0; car.previousDrift = 0;
        car.pose = this.track.pose(car.distance, car.lane); car.previousPose = car.pose;
        return 'respawn';
      }
      return null;
    }
    car.throttle = clamp(throttle, 0, 1);
    const cfg = car.setup || PHYSICS;
    const v = car.speed;
    const drive = cfg.motorForce * car.throttle * Math.max(0, 1 - v / cfg.maxSpeed);
    const resistance = cfg.rollingResistance + cfg.aerodynamicDrag * v * v
      + cfg.engineBrake * (1 - car.throttle) + cfg.skidDrag * car.skid;
    car.speed = Math.max(0, v + (drive - resistance) / PHYSICS.mass * dt);
    const before = this.track.pose(car.distance, car.lane, car.change);
    car.distance += ((v + car.speed) * 0.5 * dt) / before.metric;
    if (car.change && car.distance >= car.change.start + car.change.length) {
      car.lane = car.change.to; car.change = null;
    }
    const pose = this.track.pose(car.distance, car.lane, car.change);
    car.pose = pose;
    car.lateralForce = lateralDemand(car.speed, pose.curvature);
    if (updateGrip(car, pose.curvature, dt)) { this.derail(car, pose); return 'derail'; }
    return null;
  }
}
