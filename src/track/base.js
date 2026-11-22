import { mod, clamp, smootherstep } from '../core/math.js';
import { PHYSICS } from '../core/config.js';
export class SlotTrack {
  get lanes(){return Array.from({length:this.laneCount??2},(_,i)=>i);}
  get extraWidth(){return ((this.laneCount??2)-2)*PHYSICS.laneOffset;}
  laneOffset(lane) { return (2*lane-((this.laneCount??2)-1))*PHYSICS.laneOffset; }
  switchTarget(gate,lane){
    if((this.laneCount??2)===2)return 1-lane;
    if(gate.id%2===0)return lane%2?lane-1:lane+1;
    return lane===1?2:lane===2?1:lane;
  }

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
    if(p.fork){const side=lane<((this.laneCount??2)/2)?-.5:.5;d+=side*p.fork.offset;first+=side*p.fork.first;second+=side*p.fork.second;}
    const bank=p.bank||0,bp=p.bankDerivative||0,bpp=p.bankSecondDerivative||0;
    const verticalOffset=-d*Math.sin(bank),verticalFirst=(p.grade||0)-first*Math.sin(bank)-d*Math.cos(bank)*bp;
    const horizontal=d*Math.cos(bank),hFirst=first*Math.cos(bank)-d*Math.sin(bank)*bp;
    const hSecond=second*Math.cos(bank)-2*first*Math.sin(bank)*bp-d*Math.cos(bank)*bp*bp-d*Math.sin(bank)*bpp;
    d=horizontal;first=hFirst;second=hSecond;
    const along = 1 - p.curvature * d;
    const qx = along * p.tx + first * p.nx, qy = along * p.ty + first * p.ny;
    const horizontalMetric = Math.hypot(qx,qy),metric=Math.hypot(horizontalMetric,verticalFirst);
    // The normal derivative includes curvature change for spline modules.
    const kp = p.curvatureDerivative || 0;
    const ddx = (-2 * p.curvature * first - kp * d) * p.tx + (p.curvature * along + second) * p.nx;
    const ddy = (-2 * p.curvature * first - kp * d) * p.ty + (p.curvature * along + second) * p.ny;
    return { ...p, fork:null, x: p.x + p.nx * d, y: p.y + p.ny * d, z:p.z+verticalOffset,
      tx: qx / horizontalMetric, ty: qy / horizontalMetric, angle: Math.atan2(qy, qx), metric, horizontalMetric, pitch:Math.atan2(verticalFirst,horizontalMetric),
      curvature: (qx * ddy - qy * ddx) / horizontalMetric ** 3 };
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
