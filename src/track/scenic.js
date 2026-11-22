import { forkAt } from './fork.js';
import { SlotTrack } from './base.js';
import { EnduranceTrack } from './endurance.js';
import { mod, clamp, smootherstep } from '../core/math.js';

/** A real helix: extra revolutions share XY but never the same road elevation.
 * The exit descends along the remaining circuit, closing smoothly at the start. */
export class SpiralTrack extends EnduranceTrack {
  constructor({radius=3.3,turns=1,width=12,height=7,lift=2.2}={}){
    super({points:[[-width,-height],[width,-height],[width,height],[width*.2,height],[width*.2,height*.2],[-width,height*.2]],radius:[2.15,radius,2.15,2.15,2.15,2.15]});
    this.spiral=this.segments[1];this.spiral.length+=turns*Math.PI*2*radius;
    this.length=0;for(const segment of this.segments){segment.start=this.length;this.length+=segment.length;}
    this.spiralEnd=this.spiral.start+this.spiral.length;this.lift=lift;this.turns=turns;
    this.switches=this.segments.filter(s=>s.type==='line'&&s.length>6).map((s,id)=>({id,start:s.start+.7,activationEnd:s.start+1.2,end:s.start+3.9}));
  }
  sample(distance){const p=super.sample(distance),s=p.s;let z=0;
    if(s>=this.spiral.start&&s<=this.spiralEnd)z=this.lift*smootherstep((s-this.spiral.start)/this.spiral.length);
    else if(s>this.spiralEnd)z=this.lift*(1-smootherstep((s-this.spiralEnd)/(this.length-this.spiralEnd)));
    return {...p,z,bridge:z>.1};
  }
}

export class ScenicTrack extends SlotTrack {
  constructor(base,{bank=.2,tunnelCount=1,theme='forest',feature='curve sopraelevate'}={}){
    super();this.base=base;this.length=base.length;this.width=.70;this.switches=base.switches;this.segments=base.segments;for(const key of ['straightLength','halfLength','arcLength','radius'])if(base[key]!==undefined)this[key]=base[key];this.maxBank=bank;this.theme=theme;this.feature=feature;
    let lines=base.segments?.filter(s=>s.type==='line'&&s.length>5)??[];
    if(!lines.length&&base.straightLength)lines=[{start:0,length:base.straightLength},{start:base.halfLength??base.straightLength+Math.PI*base.radius,length:base.straightLength}];
    if(!lines.length)lines=[{start:3,length:5}];
    this.tunnels=lines.slice(-tunnelCount).map((l,i)=>({start:l.start+Math.max(2.1,l.length*.42),end:l.start+Math.min(l.length-.5,Math.max(2.1,l.length*.42)+Math.min(5,l.length*.32)),id:i})).filter(t=>t.end-t.start>1);
  }
  bankAt(p){
    if(Math.abs(p.curvature)<.015)return 0;
    let u;
    if(this.base.segments){const seg=this.base.segments[p.section];u=(p.s-seg.start)/seg.length;}
    else if(this.base.arcLength){const start=p.section===1?this.base.straightLength:2*this.base.straightLength+this.base.arcLength;u=(p.s-start)/this.base.arcLength;}
    else if(this.base.radius&&this.base.straightLength){const L=this.base.straightLength,A=Math.PI*this.base.radius;u=(p.s-(p.section===1?L:2*L+A))/A;}
    else return this.maxBank*Math.tanh(p.curvature*3);
    let amount=this.base.spiral?(this.base.segments[p.section]===this.base.spiral?this.maxBank:.09):(p.section%4===3?Math.min(.10,this.maxBank):this.maxBank);
    if(this.variant>=0&&this.base.segments)amount*=Math.min(1,this.base.segments[p.section].length/4);
    const transition=this.meeting ? smootherstep(clamp(Math.min(u,1-u)/.32,0,1)) : Math.sin(Math.PI*clamp(u,0,1))**2;
    return Math.sign(p.curvature)*amount*transition;
  }
  sample(distance){const s=mod(distance,this.length),p=this.base.sample(s),e=.025,a=this.base.sample(s-e),b=this.base.sample(s+e),bank=this.bankAt(p),ba=this.bankAt(a),bb=this.bankAt(b);
    const lift=angle=>(.38+this.extraWidth)*Math.abs(Math.sin(angle));
    return {...p,fork:forkAt(this.fork,s),z:p.z+lift(bank),bank,grade:(b.z+lift(bb)-a.z-lift(ba))/(2*e),bankDerivative:(bb-ba)/(2*e),bankSecondDerivative:(bb-2*bank+ba)/(e*e),tunnel:this.tunnels.find(t=>s>=t.start&&s<=t.end)??null};
  }
  tunnelAt(distance,padding=0){const s=mod(distance,this.length);return this.tunnels.find(t=>s>=t.start-padding&&s<=t.end+padding)??null;}
}
