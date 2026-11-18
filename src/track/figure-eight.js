import { mod } from '../core/math.js';
import { SlotTrack } from './base.js';

/** Four modular analytic sections: straight, right arc, straight, left arc.
 * The tangents of both circles meet exactly; no sampled spline shortcuts.
 * s is centreline distance, NOT distance travelled on an offset lane.
 */
export class FigureEight extends SlotTrack {
  constructor({ radius = 1.58, halfSpacing = 2.54, elevation = .27 } = {}) {
    super();
    this.radius = radius; this.elevation = elevation;
    this.halfSpacing = halfSpacing;
    this.width = 0.70;
    const r = this.radius, d = this.halfSpacing;
    this.theta = Math.acos(r / d);
    this.q = d - r * r / d;
    this.h = r * Math.sqrt(1 - (r / d) ** 2);
    this.straightLength = Math.hypot(this.q * 2, this.h * 2);
    this.arcAngle = Math.PI * 2 - 2 * this.theta;
    this.arcLength = this.arcAngle * r;
    this.halfLength = this.straightLength + this.arcLength;
    this.length = this.halfLength * 2;
    this.switches = [0, this.halfLength].map((s, index) => ({
      id: index, start: s + 0.48, activationEnd: s + 0.83, end: s + 2.08,
    }));
  }

  sample(distance) {
    const s = mod(distance, this.length), L = this.straightLength, A = this.arcLength;
    let x, y, tx, ty, curvature = 0, z = 0, bridge = false, section;
    if (s < L) {
      const u = s / L;
      x = -this.q + 2 * this.q * u; y = this.h - 2 * this.h * u;
      tx = 2 * this.q / L; ty = -2 * this.h / L;
      z = this.elevation * Math.sin(Math.PI * u) ** 2; bridge = true; section = 0;
    } else if (s < L + A) {
      const a = -Math.PI + this.theta + (s - L) / this.radius;
      x = this.halfSpacing + this.radius * Math.cos(a); y = this.radius * Math.sin(a);
      tx = -Math.sin(a); ty = Math.cos(a); curvature = 1 / this.radius; section = 1;
    } else if (s < 2 * L + A) {
      const u = (s - L - A) / L;
      x = this.q - 2 * this.q * u; y = this.h - 2 * this.h * u;
      tx = -2 * this.q / L; ty = -2 * this.h / L; section = 2;
    } else {
      const a = -this.theta - (s - 2 * L - A) / this.radius;
      x = -this.halfSpacing + this.radius * Math.cos(a); y = this.radius * Math.sin(a);
      tx = Math.sin(a); ty = -Math.cos(a); curvature = -1 / this.radius; section = 3;
    }
    return { s, x, y, z, tx, ty, nx: -ty, ny: tx, curvature, bridge, section };
  }

}
