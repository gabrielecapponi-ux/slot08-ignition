import { EnduranceTrack } from './endurance.js';

export const STUNTS = {
  masone: {name:'Masone Verticale',theme:'forest',radius:1.15,points:[[-14,-6],[14,-6],[14,6],[2,6],[2,1],[-14,1]],loops:1},
  riviera: {name:'Riviera Doppio Loop',theme:'coast',radius:1.35,points:[[-18,-7],[18,-7],[18,7],[8,7],[3,3],[-8,7],[-18,5]],loops:2}
};

export function stuntBase(spec) {
  const base=new EnduranceTrack({points:spec.points,radius:spec.turnRadius??2.4});
  const flat=base.sample.bind(base), start=6, span=7, radius=spec.radius;
  base.loopZone=spec.loops?{start,end:start+span*spec.loops,span,radius}:null;
  base.sample=distance=>{
    const p=flat(distance), local=p.s-start;
    if(spec.flip && local>=0 && local<5){
      const u=local/5, a=2*Math.PI*u, height=1.25*Math.sin(Math.PI*u)**2;
      return {...p,z:p.z+height,flipAngle:-(a-Math.sin(a)),bridge:true};
    }
    if(local<0 || local>=span*spec.loops)return p;
    const t=(local%span)/span;
    const u=Math.max(0,Math.min(1,(t-.24)/.52)), a=2*Math.PI*u;
    const active=t>.24&&t<.76, rate=active?2*Math.PI/(span*.52):0;
    const ease=u*u*(3-2*u);
    const entry=span*.445,exit=span-entry;
    const travel=t<=.24?entry*t/.24:t>=.76?exit+entry*(t-.76)/.24:entry+(exit-entry)*u+radius*Math.sin(a);
    const dx=travel-t*span,dz=radius*(1-Math.cos(a));
    const side=t>.76?.88*(1-(t-.76)/.24):.88*ease;
    const forward=active?(exit-entry)/(span*.52)+radius*Math.cos(a)*rate:entry/(span*.24);
    const vertical=radius*Math.sin(a)*rate,lateral=active?.88*6*u*(1-u)/(span*.52):t>.76?-.88/(span*.24):0;
    return {...p,x:p.x+p.tx*dx+p.nx*side,y:p.y+p.ty*dx+p.ny*side,z:p.z+dz,
      loopPitch:Math.atan2(vertical,forward),loopMetric:Math.hypot(forward,vertical,lateral),bridge:dz>.08};
  };
  return base;
}
