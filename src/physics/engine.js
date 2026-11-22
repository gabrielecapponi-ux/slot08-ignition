import { surfaceGrip } from '../track/conditions.js';
import { collideBarriers } from './barriers.js';
import { createLandscape } from '../track/landscape.js';
import { PHYSICS } from '../core/config.js';
import { clamp } from '../core/math.js';
import { updateGrip, bodyPose } from './grip.js';

export const lateralDemand = (speed, curvature, mass = PHYSICS.mass) => mass * speed * speed * Math.abs(curvature);
export const safeSpeed = (curvature, force = PHYSICS.gripForce, bank = 0) => Math.abs(curvature) < 1e-9
  ? Infinity : Math.sqrt(Math.max(0,force + PHYSICS.mass * PHYSICS.gravity * Math.sin(bank)*Math.sign(curvature)) / (PHYSICS.mass * Math.abs(curvature) * Math.cos(bank)));

/** Pure simulation service: no DOM, renderer, clock or persistence dependency. */
export class PhysicsEngine {
  constructor(track) { this.track = track; }

  changeLane(car) {
    if (car.state !== 'slotted' || car.change || !this.track.switchAt(car.distance)) return false;
    const gate = this.track.switchAt(car.distance);
    const target=this.track.switchTarget?.(gate,car.lane)??1-car.lane;
    if(target===car.lane)return false;
    const local = this.track.sample(car.distance).s;
    car.change = { from: car.lane, to: target, start: car.distance, length: gate.end - local };
    return true;
  }

  derail(car, pose) {
    const body = bodyPose(pose, car.driftAngle);
    car.state = 'derailed'; car.recoverIn = PHYSICS.recoverySeconds; car.crashes++;
    car.crash = { x: body.x, y: body.y, z: pose.z + 0.077, vx: pose.tx * car.speed,
      vy: pose.ty * car.speed, launchAngle:body.angle, roll:0, rollSpeed:car.speed*(car.driftAngle<0?-1.2:1.2), vz: Math.min(.38,.10+car.speed*.035), angle: body.angle,
      spin: -Math.sign(pose.curvature || 1) * car.speed * 1.6, bridge: pose.bridge };
    // Keep centreline distance fixed: a crash cannot advance checkpoint/lap progress.
    // A crash in a switch returns to its original lane at the SAME position.
    car.change = null; car.switchQueued = false; car.speed = 0; car.throttle = 0; car.skid = 0;
  }

  step(car, throttle, dt) {
    if (car.finishedAt !== null) return null;
    if (car.state === 'derailed') {
      const c = car.crash, previous={x:car.crash.x,y:car.crash.y,z:car.crash.z};
      const fade = Math.exp(-PHYSICS.slideFriction * dt);
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.vx *= fade; c.vy *= fade;
      c.roll=(c.roll||0)+(c.rollSpeed||0)*dt;c.rollSpeed=(c.rollSpeed||0)*fade;c.angle += c.spin * dt; c.spin *= fade;
      let floor=0;
      if(this.track.bounds && this.track.sample){
        this.field??=createLandscape(this.track);
        collideBarriers(c,previous,this.field.nearby(c.x,c.y),this.track.extraWidth??0);
        floor=this.field.height(c.x,c.y);
        for(const p of this.field.nearby(c.x,c.y)){
          const spread=(p.fork?.offset||0)/2;
          if(Math.abs(p.x-c.x)>.49+spread+(this.track.extraWidth??0)||Math.abs(p.y-c.y)>.49+spread+(this.track.extraWidth??0))continue;
          const offset=(c.x-p.x)*p.nx+(c.y-p.y)*p.ny;
          const deck=p.z+.077-offset*Math.sin(p.bank||0);
          if(Math.abs(offset)>=spread&&Math.abs(offset)<.38+spread+(this.track.extraWidth??0) && deck<=c.z+.015)floor=Math.max(floor,deck);
        }
      }
      c.vz-=PHYSICS.gravity*dt;c.z+=c.vz*dt;
      if(c.z<floor){if(c.vz<-.6)c.contacts=(c.contacts||0)+1;c.z=floor;c.vz=c.vz<-.35?-c.vz*.30:0;c.rollSpeed*=Math.exp(-2.1*dt);}
      car.recoverIn = Math.max(0, car.recoverIn - dt);
      if (car.recoverIn <= 1e-8) {
        car.state = 'slotted'; car.crash = null; car.recoverIn = 0; car.gripRatio = 0; car.instability = 0; car.driftAngle = 0; car.previousDrift = 0;
        car.pose = this.track.pose(car.distance, car.lane); car.previousPose = car.pose;
        return 'respawn';
      }
      return null;
    }
    const cfg = car.setup || PHYSICS;
    const requested=clamp(throttle,0,1),response=requested>car.throttle?cfg.throttleRise:cfg.throttleFall;
    car.throttle+=(requested-car.throttle)*(1-Math.exp(-dt/response));
    const v = car.speed;
    // Extra geared stall torque falls away below cruising speed; it also applies on level track.
    const lowSpeedTorque = 1 + .80 * Math.max(0, 1 - v / 1.8) ** 2;
    const before = this.track.pose(car.distance, car.lane, car.change);
    const straight = clamp(1 - Math.abs(before.curvature || 0) / .18, 0, 1);
    const fullPower = clamp((car.throttle - .65) / .35, 0, 1);
    const drive = (1 + .35 * straight * fullPower) * cfg.motorForce * lowSpeedTorque * car.throttle * Math.max(0, 1 - v / cfg.maxSpeed);
    const resistance = cfg.rollingResistance + cfg.aerodynamicDrag * v * v
      + cfg.engineBrake * (1 - car.throttle) * Math.min(1,v/.65) + cfg.skidDrag * car.skid;
    const gravity = PHYSICS.gravity*Math.sin(before.pitch || 0);
    car.speed = Math.max(0, v + ((drive - resistance) / cfg.mass-gravity)*dt);
    car.distance += ((v + car.speed) * 0.5 * dt) / before.metric;
    if (car.change && car.distance >= car.change.start + car.change.length) {
      car.lane = car.change.to; car.change = null;
    }
    const pose = this.track.pose(car.distance, car.lane, car.change);
    car.pose = pose;
    const horizontalSpeed=car.speed*(pose.horizontalMetric??pose.metric)/pose.metric,bank=pose.bank||0;
    car.lateralForce = Math.max(0,lateralDemand(horizontalSpeed, pose.curvature)*Math.cos(bank)-cfg.mass*PHYSICS.gravity*Math.sin(bank)*Math.sign(pose.curvature));
    car.surfaceGrip=surfaceGrip(this.track,car.distance,car.change?null:car.lane,cfg);
    if (updateGrip(car, pose.curvature, dt)) { this.derail(car, pose); return 'derail'; }
    return null;
  }
}
