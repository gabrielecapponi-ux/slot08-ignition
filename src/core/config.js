/** All simulation units are SI: metres, seconds, kilograms, newtons. */
export const PHYSICS = Object.freeze({
  fixedStep: 1 / 120,
  maxFrameTime: 0.1,
  mass: 0.085,
  motorForce: 0.40,
  maxSpeed: 4.9,
  rollingResistance: 0.022,
  aerodynamicDrag: 0.006,
  engineBrake: 0.19,
  gripForce: 0.245,
  powerGripLoss: 0.10,
  throttleRise: 0.14,
  throttleFall: 0.045,
  skidDrag: 0.022,
  recoverySeconds: 3,
  slideFriction: 2.8,
  laneOffset: 0.145,
  carLength: 0.29,
  modelScale: 18,
});
export const RACE = Object.freeze({ laps: 3, countdown: 3, startDistance: 0.08 });
export const COLORS = Object.freeze({ mint: '#c6f568', orange: '#ff854e', blue: '#8bbcff', pink: '#e7a8d7' });
