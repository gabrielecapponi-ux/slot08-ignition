import * as THREE from 'three';
import { clamp, smootherstep } from '../core/math.js';
/** The sole owner of camera transforms. Race simulation never reads a camera. */
export class CameraRig {
  constructor(camera,track){this.camera=camera;this.track=track;this.mode='drone';this.age=0;this.focus=new THREE.Vector3();this.initial=true;this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');}
  setTrack(track){this.track=track;this.age=0;this.initial=true;}
  setMode(mode){this.mode=mode;this.initial=this.motion.matches;}
  update(session,dt){
    if(this.garage){const c=this.camera,angle=this.garageAngle??.8,small=c.aspect<.9;const width=c.aspect*1000,height=1000;c.setViewOffset(width,height,small?0:-width*.19,small?height*.30:0,width,height);const fit=small?1.2/c.aspect:1;c.position.set(Math.cos(angle)*.55*fit,.35*fit,Math.sin(angle)*.55*fit);c.lookAt(0,.06,0);c.fov=43;c.updateProjectionMatrix();return true;}
    this.camera.clearViewOffset();
    if(session.status==='paused')return false;
    this.age+=dt;const p=session.player.crash??session.player.pose,c=this.camera,aspect=c.aspect,b=this.track.bounds;
    const width=b.maxX-b.minX,height=b.maxY-b.minY,span=Math.max(width/aspect,height)*1.45;
    let pos=new THREE.Vector3((b.minX+b.maxX)/2,span*.98,span*.72),look=new THREE.Vector3((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2),fov=48;
    const ready=session.status==='ready',intro=ready&&!this.motion.matches&&this.age<4.4;
    const moving=!ready&&session.status!=='finished'&&session.status!=='tutorial-complete';
    const heading=p.angle??0,tx=Math.cos(heading),ty=Math.sin(heading),ground=(p.z||0)+.08;
    if(intro){const u=smootherstep(clamp((this.age-.7)/3.7,0,1));const close=new THREE.Vector3(p.x+tx*.5-ty*.65,ground+.32,p.y+ty*.5+tx*.65);pos.lerpVectors(close,pos,u);look.lerpVectors(new THREE.Vector3(p.x,ground+.06,p.y),look,u);}
    else if(moving&&this.mode==='drone'){
      const v=session.player.speed;pos.set(p.x-tx*(1.35+v*.12)-ty*.16,ground+(aspect<.9?1.05:.88)+v*.055,p.y-ty*(1.35+v*.12)+tx*.16);
      const ahead=this.track.pose(session.player.distance+(aspect<.9?.85:1.65),session.player.lane,session.player.change);look.set(ahead.x,ahead.z+.13,ahead.y);fov=54+v*1.5;
      // Raise the following drone over the upper deck while the car is underneath.
      if(this.track.tunnelAt?.(session.player.distance,1.6)){pos.set(p.x-tx*.8,ground+.39,p.y-ty*.8);const next=this.track.pose(session.player.distance+1.2,session.player.lane,session.player.change);look.set(next.x,next.z+.20,next.y);fov=66;}
    }else if(moving&&this.mode==='rail'){
      pos.set(p.x-tx*.65-ty*1.5,ground+.62,p.y-ty*.65+tx*1.5);look.set(p.x+tx*.75,ground+.05,p.y+ty*.75);fov=52;if(this.track.tunnelAt?.(session.player.distance,1.6)){pos.set(p.x-tx*.8,ground+.39,p.y-ty*.8);fov=66;}
    }else if(this.mode==='top'&&moving){pos.set((b.minX+b.maxX)/2,Math.max(width/aspect,height)*1.38,(b.minY+b.maxY)/2+.001);look.set((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2);}
    if(moving&&session.isLocal&&['top','iso'].includes(this.mode)){const ps=session.players.map(car=>car.crash??car.pose),xs=ps.map(q=>q.x),ys=ps.map(q=>q.y),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),cx=(loX+hiX)/2,cy=(loY+hiY)/2;const framing=Math.max((hiX-loX+9)/aspect,hiY-loY+8);pos.set(cx,framing*1.42,cy+(this.mode==='iso'?framing*.5:.001));look.set(cx,0,cy);}
    const t=this.initial||this.motion.matches?1:1-Math.exp(-dt*(moving?6:3.8));c.position.lerp(pos,t);this.focus.lerp(look,t);c.lookAt(this.focus);c.fov=THREE.MathUtils.lerp(c.fov,fov,t);c.updateProjectionMatrix();this.initial=false;
    return intro||moving;
  }
}
