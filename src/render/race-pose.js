import {bodyPose} from '../physics/grip.js';

export function angleMix(a,b,t){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;}

// Camera and body share the very same interpolated simulation instant.
// A respawn is a discontinuity and must never sweep the car across the scenery.
export function racePose(car,alpha=1){
 const p=car.pose,prev=car.previousPose??p;
 const continuous=car.previousState===undefined||car.previousState===car.state;
 const t=continuous&&Math.hypot(p.x-prev.x,p.y-prev.y,(p.z||0)-(prev.z||0))<1?Math.max(0,Math.min(1,alpha)):1;
 const mix=(a,b)=>(a??0)+((b??0)-(a??0))*t;
 const angle=angleMix(prev.angle,p.angle,t);
 const guide={...p,x:mix(prev.x,p.x),y:mix(prev.y,p.y),z:mix(prev.z,p.z),angle,tx:Math.cos(angle),ty:Math.sin(angle),bank:mix(prev.bank,p.bank),pitch:angleMix(prev.pitch||0,p.pitch||0,t)};
 return {...guide,guideAngle:angle,...bodyPose(guide,mix(car.previousDrift??car.driftAngle,car.driftAngle))};
}
