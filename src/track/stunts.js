import { EnduranceTrack } from './endurance.js';

export const STUNTS = {
  masone: {name:'Masone Verticale',theme:'forest',radius:1.15,points:[[-14,-6],[14,-6],[14,6],[2,6],[2,1],[-14,1]],loops:1},
  riviera: {name:'Riviera Doppio Loop',theme:'coast',radius:1.35,points:[[-18,-7],[18,-7],[18,7],[8,7],[3,3],[-8,7],[-18,5]],loops:2}
};

export function stuntBase(spec) {
  const base=new EnduranceTrack({points:spec.points,radius:spec.turnRadius??2.4});
  const flat=base.sample.bind(base), start=6, span=7, radius=spec.radius;
  base.sample=distance=>{
    const p=flat(distance), local=p.s-start;
    if(spec.flip && local>=0 && local<5){
      const u=local/5, a=2*Math.PI*u, height=1.25*Math.sin(Math.PI*u)**2;
      return {...p,z:p.z+height,flipAngle:-(a-Math.sin(a)),bridge:true};
    }
    if(local<0 || local>=span*spec.loops)return p;
    const u=(local%span)/span, a=2*Math.PI*u;
    // Ease the rotation at the joins. Sideways separation clears the return deck.
    const phase=a-Math.sin(a), rate=2*Math.PI*(1-Math.cos(a))/span;
    const dx=radius*Math.sin(phase), dz=radius*(1-Math.cos(phase));
    const side=.95*Math.sin(a)**3, forward=1+radius*Math.cos(phase)*rate;
    const vertical=radius*Math.sin(phase)*rate, lateral=2*Math.PI/span*2.85*Math.sin(a)**2*Math.cos(a);
    return {...p,x:p.x+p.tx*dx+p.nx*side,y:p.y+p.ty*dx+p.ny*side,z:p.z+dz,
      loopPitch:Math.atan2(vertical,forward),loopMetric:Math.hypot(forward,vertical,lateral),bridge:dz>.08};
  };
  return base;
}
