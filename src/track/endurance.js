import { SlotTrack } from './base.js';
import { mod } from '../core/math.js';

/** Authored polygons become exact straight/arc modules, not stretched splines.
 * The same arc-length path drives rails, braking signs and centrifugal physics. */
export class EnduranceTrack extends SlotTrack {
  constructor({ points, radius = 2.4, elevation = 0 }) {
    super(); this.width = .70; this.segments = []; this.length = 0; this.elevation = elevation;
    const corners = points.map((p, i) => {
      const prev = points[mod(i - 1, points.length)], next = points[(i + 1) % points.length];
      const a = Math.hypot(p[0] - prev[0], p[1] - prev[1]), b = Math.hypot(next[0] - p[0], next[1] - p[1]);
      const u = [(p[0] - prev[0]) / a, (p[1] - prev[1]) / a], v = [(next[0] - p[0]) / b, (next[1] - p[1]) / b];
      const turn = Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
      const tan = Math.tan(Math.abs(turn) / 2), cut = Math.min(radius * tan, a * .38, b * .38), r = cut / tan;
      const entry = [p[0] - u[0] * cut, p[1] - u[1] * cut], exit = [p[0] + v[0] * cut, p[1] + v[1] * cut];
      return { entry, exit, u, v, turn, radius: r };
    });
    const add = segment => { segment.start = this.length; this.length += segment.length; this.segments.push(segment); };
    for (let i = 0; i < corners.length; i++) {
      const from = corners[i], to = corners[(i + 1) % corners.length];
      add({ type: 'line', x: from.exit[0], y: from.exit[1], tx: from.v[0], ty: from.v[1], length: Math.hypot(to.entry[0] - from.exit[0], to.entry[1] - from.exit[1]) });
      const sign = Math.sign(to.turn), cx = to.entry[0] - to.u[1] * to.radius * sign, cy = to.entry[1] + to.u[0] * to.radius * sign;
      add({ type: 'arc', cx, cy, radius: to.radius, sign, angle: Math.atan2(to.entry[1] - cy, to.entry[0] - cx), length: Math.abs(to.turn) * to.radius });
    }
    this.switches = this.segments.filter(s => s.type === 'line' && s.length > 6).map((s, id) => ({ id, start: s.start + .7, activationEnd: s.start + 1.2, end: s.start + 3.9 }));
  }
  sample(distance) {
    const s = mod(distance, this.length);
    // At most 24 modules per track: bounded scan, no per-frame lookup allocation.
    let j = this.segments.length - 1;
    while (j > 0 && this.segments[j].start > s) j--;
    const seg = this.segments[j], d = s - seg.start;
    let x, y, tx, ty, curvature = 0;
    if (seg.type === 'line') { ({ tx, ty } = seg); x = seg.x + tx * d; y = seg.y + ty * d; }
    else { const a = seg.angle + seg.sign * d / seg.radius; x = seg.cx + seg.radius * Math.cos(a); y = seg.cy + seg.radius * Math.sin(a); tx = -Math.sin(a) * seg.sign; ty = Math.cos(a) * seg.sign; curvature = seg.sign / seg.radius; }
    const u = (s / this.length - .38) / .18;
    const z = this.elevation && u > 0 && u < 1 ? this.elevation * Math.sin(Math.PI * u) ** 2 : 0;
    return { s, x, y, z, tx, ty, nx: -ty, ny: tx, curvature, bridge: z > .05, section: j };
  }
}

export const ENDURANCE_LAYOUTS = [
  { points: [[-16,-4],[16,-4],[16,4],[-16,4]], radius: 2.6 },
  { points: [[-14,-7],[14,-7],[14,7],[2,7],[2,0],[-14,0]], radius: 2.4 },
  { points: [[-20,-5],[20,-5],[20,5],[-20,5]], radius: 3.3, elevation: .8 },
  { points: [[-16,-8],[16,-8],[16,8],[6,8],[6,1],[-6,1],[-6,8],[-16,8]], radius: 2.2 },
  { points: [[-23,-7],[18,-7],[23,0],[18,7],[-15,7],[-23,1]], radius: 2.8 },
  { points: [[-20,-9],[20,-9],[20,2],[8,2],[8,9],[-20,9]], radius: 2.5, elevation: .9 },
  { points: [[-24,-10],[24,-10],[24,10],[12,10],[12,0],[-3,0],[-3,10],[-24,10]], radius: 2.6 },
  { points: [[-26,-6],[26,-6],[26,6],[12,6],[8,1],[-8,1],[-12,6],[-26,6]], radius: 2.5 },
  { points: [[-28,-10],[28,-10],[28,10],[8,10],[8,2],[-10,2],[-10,10],[-28,10]], radius: 3, elevation: 1 },
  { points: [[-29,-10],[22,-10],[29,-2],[22,10],[-7,10],[-7,0],[-29,0]], radius: 2.7 },
  { points: [[-30,-12],[30,-12],[30,12],[14,12],[14,1],[-14,1],[-14,12],[-30,12]], radius: 3.2 },
  { points: [[-34,-12],[34,-12],[34,12],[18,12],[18,0],[2,0],[2,12],[-16,12],[-16,1],[-34,1]], radius: 2.8, elevation: 1.1 },
];
