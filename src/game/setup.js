import { PHYSICS } from '../core/config.js';

// Difficulty changes everyone's grip equally; only the opponent's driving differs.
export const DIFFICULTIES = Object.freeze({
  rookie: { label: 'Rookie', grip: 1.15, pace: .89, reaction: .18, errorRate: .14 },
  club: { label: 'Club', grip: 1, pace: .96, reaction: .14, errorRate: .12 },
  pro: { label: 'Pro', grip: .92, pace: 1.015, reaction: .095, errorRate: .09 },
});
export function carSetup(difficulty = 'club', upgrades = {}) {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.club;
  return { ...PHYSICS,
    motorForce: PHYSICS.motorForce * (1 + .10 * (upgrades.motor || 0)),
    maxSpeed: PHYSICS.maxSpeed * (1 + .07 * (upgrades.motor || 0)),
    gripForce: PHYSICS.gripForce * d.grip * (1 + .05 * (upgrades.grip || 0)),
    engineBrake: PHYSICS.engineBrake * (1 + .15 * (upgrades.brake || 0)),
  };
}
