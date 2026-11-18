import { mod, clamp, smootherstep } from '../core/math.js';
import { PHYSICS } from '../core/config.js';
export class SlotTrack {
  laneOffset(lane) { return lane === 0 ? -PHYSICS.laneOffset : PHYSICS.laneOffset; }

  /** Lane-change derivatives are analytic, so its centrifugal demand is real too. */
  pose(distance, lane, change = null) {
    const p = this.sample(distance);
    let d = this.laneOffset(lane), first = 0, second = 0;
    if (change) {
      const u = clamp((distance - change.start) / change.length, 0, 1);
      const a = this.laneOffset(change.from), span = this.laneOffset(change.to) - a;
      d = a + span * smootherstep(u);
      first = span * (30 * u ** 2 * (u - 1) ** 2) / change.length;
      second = span * (120 * u ** 3 - 180 * u ** 2 + 60 * u) / change.length ** 2;
    }
    const along = 1 - p.curvature * d;
    const qx = along * p.tx + first * p.nx, qy = along * p.ty + first * p.ny;
    const metric = Math.hypot(qx, qy);
    // The normal derivative includes curvature change for spline modules.
    const kp = p.curvatureDerivative || 0;
    const ddx = (-2 * p.curvature * first - kp * d) * p.tx + (p.curvature * along + second) * p.nx;
    const ddy = (-2 * p.curvature * first - kp * d) * p.ty + (p.curvature * along + second) * p.ny;
    return { ...p, x: p.x + p.nx * d, y: p.y + p.ny * d,
      tx: qx / metric, ty: qy / metric, angle: Math.atan2(qy, qx), metric,
      curvature: (qx * ddy - qy * ddx) / metric ** 3 };
  }

  switchAt(distance) {
    const s = mod(distance, this.length);
    return this.switches.find(g => s >= g.start && s <= g.activationEnd) ?? null;
  }

  nextSwitchDistance(distance) {
    const s = mod(distance, this.length);
    return Math.min(...this.switches.map(g => mod(g.start - s, this.length)));
  }
}
