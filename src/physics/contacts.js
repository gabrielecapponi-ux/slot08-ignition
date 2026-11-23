import { PHYSICS } from '../core/config.js';
import { bodyPose } from './grip.js';

// Rectangle SAT in the physical XY plane. Separate bridge decks cannot collide.
export function bodyContact(a,b){
 const p=bodyPose(a.pose,a.driftAngle),q=bodyPose(b.pose,b.driftAngle);
 if(Math.abs(p.z-q.z)>.12||Math.hypot(q.x-p.x,q.y-p.y)>.36)return null;
 const A={x:Math.cos(p.angle),y:Math.sin(p.angle)},B={x:Math.cos(q.angle),y:Math.sin(q.angle)};
 const axes=[A,{x:-A.y,y:A.x},B,{x:-B.y,y:B.x}];let result=null;
 for(const n of axes){
  const radius=t=>PHYSICS.carLength*.5*Math.abs(t.x*n.x+t.y*n.y)+.077*Math.abs(-t.y*n.x+t.x*n.y);
  const dot=(q.x-p.x)*n.x+(q.y-p.y)*n.y,depth=radius(A)+radius(B)-Math.abs(dot);
  if(depth<=0)return null;
  if(!result||depth<result.depth)result={nx:n.x*(dot>=0?1:-1),ny:n.y*(dot>=0?1:-1),depth};
 }
 return result;
}
export function resolveContacts(track,cars,physics,onEvent=()=>{},time=0){
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
  const a=cars[i],b=cars[j];if(a.rejoinUntil>time||b.rejoinUntil>time||a.state!=='slotted'||b.state!=='slotted'||a.finishedAt!==null||b.finishedAt!==null)continue;
  const contact=bodyContact(a,b);if(!contact)continue;
  const {nx,ny,depth}=contact,va={x:a.pose.tx*a.speed,y:a.pose.ty*a.speed},vb={x:b.pose.tx*b.speed,y:b.pose.ty*b.speed};
  const closing=(va.x-vb.x)*nx+(va.y-vb.y)*ny;
  if(closing>.02){
   const ma=a.setup.mass,mb=b.setup.mass,impulse=1.16*closing/(1/ma+1/mb);
   a.speed=Math.max(0,(va.x-nx*impulse/ma)*a.pose.tx+(va.y-ny*impulse/ma)*a.pose.ty);
   b.speed=Math.max(0,(vb.x+nx*impulse/mb)*b.pose.tx+(vb.y+ny*impulse/mb)*b.pose.ty);
   const lateral=Math.max(Math.abs(nx*a.pose.ty-ny*a.pose.tx),Math.abs(nx*b.pose.ty-ny*b.pose.tx));
   if(closing>1.65||lateral>.48&&closing>.6){
    const aligned=a.pose.tx*b.pose.tx+a.pose.ty*b.pose.ty>.88 && lateral<.42;
    const ahead=(b.pose.x-a.pose.x)*a.pose.tx+(b.pose.y-a.pose.y)*a.pose.ty>0?b:a;
    const attacker=ahead===a?b:a;
    const victims=aligned?[ahead]:closing>2.3||lateral>.48?[a,b]:[b];
    if(aligned){const velocity=attacker===a?va:vb;attacker.speed=Math.hypot(velocity.x,velocity.y)*.94;attacker.punted=ahead.id;}
    for(const car of victims){physics.derail(car,car.pose);car.crash.hit=true;car.crash.other=car===a?b.id:a.id;car.contactCrashes=(car.contactCrashes||0)+1;onEvent({type:'derail',car});}
   }
   if(time>Math.max(a.contactUntil??-1,b.contactUntil??-1)){
    a.contactUntil=b.contactUntil=time+.30;onEvent({type:'contact',car:a,other:b,speed:closing});
   }
  }
  // Only resolve existing overlap: there is no pre-contact braking or invisible spacing.
  const projection=nx*a.pose.tx+ny*a.pose.ty;
  if(Math.abs(projection)>.55){
   const rear=projection>0?a:b;
   if(rear.state==='slotted'){rear.distance-=(depth+.001)/Math.max(.4,rear.pose.metric);rear.pose=track.pose(rear.distance,rear.lane,rear.change);}
  }
 }
}
