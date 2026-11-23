import * as THREE from 'three';
import { clamp, smootherstep } from '../core/math.js';
import {showroomFrame,fitShowroom} from './showroom.js';
import {racePose,angleMix} from '../render/race-pose.js';

export function smoothCameraArm(current,target,t){
 const yaw=angleMix(Math.atan2(current.z,current.x),Math.atan2(target.z,target.x),t);
 const radius=THREE.MathUtils.lerp(Math.hypot(current.x,current.z),Math.hypot(target.x,target.z),t);
 return current.set(Math.cos(yaw)*radius,THREE.MathUtils.lerp(current.y,target.y,t),Math.sin(yaw)*radius);
}
/** The sole owner of camera transforms. Race simulation never reads a camera. */
export class CameraRig {
  constructor(camera,track){this.camera=camera;this.track=track;this.mode='drone';this.age=0;this.focus=new THREE.Vector3();this.initial=true;this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');}
  setTrack(track){this.track=track;this.age=0;this.initial=true;this.followOffset=null;}
  setMode(mode){this.mode=mode;this.initial=this.motion.matches;this.followOffset=null;}
  update(session,dt,alpha=1){
    if(this.garage){
      const c=this.camera,width=c.aspect*1000,height=1000,frame=this.showroomFrame??showroomFrame();
      c.setViewOffset(width,height,width*(.5-frame.x),height*(.5-frame.y),width,height);
      const targets={brush:[.099,0,0],gearing:[-.091,.033,.027],diffuser:[-.109,.007,0],motor:[-.06,.01,0],brake:[.042,0,0],under:[0,.012,0],grip:[0,.006,0],wheels:[.095,.034,.075],hood:[.08,.073,0],wing:[-.12,.12,0],exhaust:[-.14,.045,0],glass:[0,.095,0],glazing:[0,.095,0],lights:[.13,.055,0],aero:[-.10,.03,0]};
      const point=this.detail==='under'?null:targets[this.detail];
      if(!this.manual&&!this.motion.matches)this.garageAngle=(this.garageAngle??.65)+dt*.18;
      const angle=this.garageAngle??.65,el=this.elevation??.28;
      const {target,eye,fov}=fitShowroom(this.garageBounds,angle,el,c.aspect,frame,this.zoom||1,point);
      const mix=this.initial||this.motion.matches?1:1-Math.exp(-dt*8);
      c.position.lerp(eye,mix);this.focus.lerp(target,mix);c.lookAt(this.focus);c.fov=fov;c.updateProjectionMatrix();this.initial=false;return true;
    }
    this.camera.clearViewOffset();
    if(session.status==='paused')return false;
    this.age+=dt;const p=session.player.crash??racePose(session.player,alpha),c=this.camera,aspect=c.aspect,b=this.track.bounds;
    const width=b.maxX-b.minX,height=b.maxY-b.minY,span=Math.max(width/aspect,height)*1.45;
    let pos=new THREE.Vector3((b.minX+b.maxX)/2,span*.98,span*.72),look=new THREE.Vector3((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2),fov=48;
    const ready=session.status==='ready',intro=ready&&!this.motion.matches&&this.age<4.4;
    const moving=!ready&&session.status!=='finished'&&session.status!=='tutorial-complete';
    const heading=p.launchAngle??p.guideAngle??p.angle??0,tx=Math.cos(heading),ty=Math.sin(heading),ground=(p.z||0)+.08;
    const current=session.player.distance,previous=session.player.previousDistance;
    const distance=Number.isFinite(previous)&&Math.abs(current-previous)<1?previous+(current-previous)*alpha:current;
    const zone=this.track.base?.loopZone??this.track.base?.rollZone,local=zone?this.track.sample(distance).s:0;
    const sideView=moving&&zone&&!session.isLocal&&!session.player.crash&&['chase','drone','rail'].includes(this.mode)&&local>=zone.start-1.5&&local<=zone.end+.7;
    if(sideView){
      const index=Math.min(Math.floor((zone.end-zone.start)/zone.span)-1,Math.max(0,Math.floor((local-zone.start)/zone.span)));
      const axis=this.track.sample(zone.axial?local:zone.start+zone.span*(index+.5));
      const reach=Math.max(4.1,3.3/aspect)*zone.radius;
      look.set(axis.x,axis.z-(zone.axial?0:zone.radius)+.08,axis.y);
      pos.set(axis.x+axis.nx*reach,look.y+reach*.18,axis.y+axis.ny*reach);fov=46;
    }else if(intro){const u=smootherstep(clamp((this.age-.7)/3.7,0,1));const close=new THREE.Vector3(p.x+tx*.5-ty*.65,ground+.32,p.y+ty*.5+tx*.65);pos.lerpVectors(close,pos,u);look.lerpVectors(new THREE.Vector3(p.x,ground+.06,p.y),look,u);}
    else if(moving && this.mode==='chase'){
      const portal=this.track.tunnelAt?.(distance,2.4);
      const station=this.track.sample(distance).s;
      const approach=portal?smootherstep(clamp(1-Math.max(portal.start-station,station-portal.end,0)/2.4,0,1)):0;
      const blend=(outside,inside)=>outside+(inside-outside)*approach;
      const pace=clamp(session.player.speed/5,0,1);
      const lead=blend(1.25+pace*.9,.9);
      const road=this.track.pose(distance+lead,session.player.lane);
      const reach=blend(aspect<1?1.36:1.08,.72);
      pos.set(p.x-tx*reach,ground+blend(aspect<1?.86:.67,.28),p.y-ty*reach);
      look.set(p.x+tx*lead*.45+(road.x-p.x)*.55,ground+.06+clamp(road.z-p.z,-.55,.7)*.55,p.y+ty*lead*.45+(road.y-p.y)*.55);
      fov=(aspect<1?64:58)+(this.motion.matches?0:pace*4);
    }else if(moving && this.mobileRace && !session.isLocal && this.mode==='drone'){
      const lookAhead=.53;
      pos.set(p.x-tx*1.04,ground+(aspect<1?1.14:.89),p.y-ty*1.04);
      look.set(p.x+tx*lookAhead,ground+.05,p.y+ty*lookAhead);
      fov=aspect<1?57:52;
    }else if(moving&&!session.isLocal&&(this.mode==='macro'||(session.status==='countdown'&&this.mode==='drone'&&!this.motion.matches))){
      // At guide-pin height, a front three-quarter view keeps the grille, the rims and rails together.
      const portrait=aspect<.9, offset=portrait?.66:.47;
      pos.set(p.x+tx*offset-ty*.22,ground+.17,p.y+ty*offset+tx*.22);
      look.set(p.x,ground+.055,p.y);fov=portrait?44:34;
    }else if(moving&&this.mode==='drone'){
      const v=session.player.speed,reach=.73+Math.min(v,5)*.025;pos.set(p.x-tx*reach,ground+(aspect<.9?.54:.46)+Math.min(v,5)*.014,p.y-ty*reach);
      look.set(p.x,ground+.055,p.y);fov=aspect<.9?48:42;
      // Raise the following drone over the upper deck while the car is underneath.
      if(this.track.tunnelAt?.(distance,1.6)){pos.set(p.x-tx*.8,ground+.39,p.y-ty*.8);look.set(p.x,ground+.055,p.y);fov=66;}
    }else if(moving&&this.mode==='rail'){
      pos.set(p.x-tx*.65-ty*1.5,ground+.62,p.y-ty*.65+tx*1.5);look.set(p.x+tx*.75,ground+.05,p.y+ty*.75);fov=52;if(this.track.tunnelAt?.(distance,1.6)){pos.set(p.x-tx*.8,ground+.39,p.y-ty*.8);fov=66;}
    }else if((this.mode==='top'||this.mode==='macro'&&session.isLocal)&&moving){pos.set((b.minX+b.maxX)/2,Math.max(width/aspect,height)*1.38,(b.minY+b.maxY)/2+.001);look.set((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2);}
    if(moving&&session.isLocal&&['top','iso'].includes(this.mode)){const ps=session.players.map(car=>car.crash??car.pose),xs=ps.map(q=>q.x),ys=ps.map(q=>q.y),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),cx=(loX+hiX)/2,cy=(loY+hiY)/2;const framing=Math.max((hiX-loX+9)/aspect,hiY-loY+8);pos.set(cx,framing*1.42,cy+(this.mode==='iso'?framing*.5:.001));look.set(cx,0,cy);}
    if(session.status==='finished'&&!session.isLocal&&!this.motion.matches){
      const t=Math.min(1,(session.celebration??0)/3),a=heading+.75+t*.48;
      look.set(p.x,ground+.05,p.y);pos.set(p.x+Math.cos(a)*(aspect<.9?1.7:1.25),ground+.48,p.y+Math.sin(a)*1.25);fov=42;
    }
    if(session.player.crash && moving && !session.isLocal && !this.motion.matches){
      const wreck=session.player.crash, age=3-session.player.recoverIn;
      // Keep the lens on the flight path, independent of the spinning body.
      const heading=wreck.launchAngle??session.player.pose.angle;
      const side=heading+.95+Math.min(age,1.8)*.26;
      const pullBack=smootherstep(clamp((age-1.6)/1.4,0,1));
      const radius=.85+pullBack*1.0+(aspect<.9?.26:0);
      look.set(wreck.x,wreck.z+.065,wreck.y);
      const other=session.cars.find(car=>car.id===wreck.other)?.crash;
      if(other && Math.hypot(other.x-wreck.x,other.y-wreck.y)<1.2){
        look.x=(look.x+other.x)*.5;look.z=(look.z+other.y)*.5;
      }
      pos.set(look.x+Math.cos(side)*radius,look.y+.32+pullBack*.75,look.z+Math.sin(side)*radius);
      const lane=session.player.pose;
      look.lerp(new THREE.Vector3(lane.x,lane.z+.12,lane.y),pullBack*.82);
      pos.x+=(lane.x-wreck.x)*pullBack*.8;pos.z+=(lane.y-wreck.y)*pullBack*.8;
      fov=48+pullBack*9;
    }
    const t=this.initial||this.motion.matches?1:1-Math.exp(-dt*(moving?6:3.8));
    const following=!sideView&&moving&&!session.isLocal&&!session.player.crash&&['chase','drone','macro','rail'].includes(this.mode);
    if(following){
      // Smooth only the camera arm, never delay world translation relative to the car.
      const arm=pos.clone().sub(look);
      if(!this.followOffset||this.initial)this.followOffset=arm;
      else smoothCameraArm(this.followOffset,arm,this.motion.matches?1:1-Math.exp(-dt*4));
      c.position.copy(look).add(this.followOffset);this.focus.copy(look);
    }else{this.followOffset=null;c.position.lerp(pos,t);this.focus.lerp(look,t);}
    c.lookAt(this.focus);c.fov=THREE.MathUtils.lerp(c.fov,fov,t);c.updateProjectionMatrix();this.initial=false;
    return intro||moving;
  }
}
