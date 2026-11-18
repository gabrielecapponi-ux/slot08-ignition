import * as THREE from 'three';
import { clamp, smootherstep } from '../core/math.js';
/** The sole owner of camera transforms. Race simulation never reads a camera. */
export class CameraRig {
  constructor(camera,track){this.camera=camera;this.track=track;this.mode='drone';this.age=0;this.focus=new THREE.Vector3();this.initial=true;this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');}
  setTrack(track){this.track=track;this.age=0;this.initial=true;}
  setMode(mode){this.mode=mode;this.initial=this.motion.matches;}
  update(session,dt){
    if(session.status==='paused')return false;
    this.age+=dt;const p=session.player.crash??session.player.pose,c=this.camera,aspect=c.aspect,b=this.track.bounds;
    const width=b.maxX-b.minX,height=b.maxY-b.minY,span=Math.max(width/aspect,height)*1.45;
    let pos=new THREE.Vector3((b.minX+b.maxX)/2,span*.98,span*.72),look=new THREE.Vector3((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2),fov=48;
    const ready=session.status==='ready',intro=ready&&!this.motion.matches&&this.age<4.4;
    const moving=!ready&&session.status!=='finished'&&session.status!=='tutorial-complete';
    const heading=p.angle??0,tx=Math.cos(heading),ty=Math.sin(heading),ground=(p.z||0)+.08;
    if(intro){const u=smootherstep(clamp((this.age-.7)/3.7,0,1));const close=new THREE.Vector3(p.x+tx*.5-ty*.65,ground+.32,p.y+ty*.5+tx*.65);pos.lerpVectors(close,pos,u);look.lerpVectors(new THREE.Vector3(p.x,ground+.06,p.y),look,u);}
    else if(moving&&this.mode==='drone'){
      const v=session.player.speed;pos.set(p.x-tx*(1.35+v*.12)-ty*.16,ground+.88+v*.055,p.y-ty*(1.35+v*.12)+tx*.16);
      const ahead=this.track.pose(session.player.distance+1.65,session.player.lane,session.player.change);look.set(ahead.x,ground+.05,ahead.y);fov=54+v*1.5;
      // Raise the following drone over the upper deck while the car is underneath.
      if(this.track.index===1&&Math.abs(p.x)<1.5&&ground<.25)pos.y=Math.max(pos.y,1.3);
    }else if(moving&&this.mode==='rail'){
      pos.set(p.x-tx*.65-ty*1.5,ground+.62,p.y-ty*.65+tx*1.5);look.set(p.x+tx*.75,ground+.05,p.y+ty*.75);fov=52;
    }else if(this.mode==='top'&&moving){pos.set(0,Math.max(width/aspect,height)*1.28,.001);look.set(0,0,0);}
    const t=this.initial||this.motion.matches?1:1-Math.exp(-dt*(moving?6:3.8));c.position.lerp(pos,t);this.focus.lerp(look,t);c.lookAt(this.focus);c.fov=THREE.MathUtils.lerp(c.fov,fov,t);c.updateProjectionMatrix();this.initial=false;
    return intro||moving;
  }
}
