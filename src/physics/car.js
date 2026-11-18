import { PHYSICS, RACE } from '../core/config.js';

export function createCar({ id = 'player', name = 'Tu', color = '#c6f568', lane = 0, start = RACE.startDistance, ai = false, setup = PHYSICS } = {}) {
  return {
    setup, switchQueued: false, assistanceActive: false, targetSpeed: 0, id, name, color, lane, ai, start, distance: start, speed: 0,
    state: 'slotted', change: null, crash: null, recoverIn: 0,
    crashes: 0, laps: 0, lapStartedAt: 0, lastLap: null, bestLap: Infinity,
    lapTimes: [], finishedAt: null, gripRatio: 0, lateralForce: 0,
    maxGrip: setup.gripForce, throttle: 0, pose: null,
  };
}
