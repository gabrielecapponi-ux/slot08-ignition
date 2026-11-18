import { safeSpeed } from '../physics/engine.js';
import { PHYSICS } from '../core/config.js';
import { clamp } from '../core/math.js';
/** Same finite grip and motor physics for assistance, opponents and player. */
export class AIDriver {
  constructor(track,pace=.88){this.track=track;this.pace=pace;}
  input(car){
    if(car.state!=='slotted')return{throttle:0,switchLane:false};
    const cfg=car.setup||PHYSICS,braking=(cfg.engineBrake+cfg.rollingResistance)/cfg.mass;
    let target=cfg.maxSpeed*.92;
    const lookahead=Math.max(2,car.speed**2/(2*braking)+1);
    // Plan the queued physical crossover too, before the guide pin reaches it.
    let change=car.change;
    if(!change&&car.switchQueued){const ahead=this.track.nextSwitchDistance(car.distance),gate=this.track.switches.find(g=>Math.abs(((g.start-this.track.sample(car.distance).s+this.track.length)%this.track.length)-ahead)<.001);if(gate)change={from:car.lane,to:1-car.lane,start:car.distance+ahead,length:gate.end-gate.start};}
    for(let ahead=0;ahead<=lookahead;ahead+=.08){const p=this.track.pose(car.distance+ahead,car.lane,change);const limit=safeSpeed(p.curvature,car.maxGrip)*this.pace;target=Math.min(target,Math.sqrt(limit**2+2*braking*ahead*.75));}
    car.targetSpeed=target;
    const throttle=car.speed<target-.10?1:car.speed>target?0:clamp(.52+(target-car.speed)*3,0,1);
    return{throttle,switchLane:false};
  }
}
