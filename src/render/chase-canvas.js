import {racePose} from './race-pose.js';
import { drawSector } from '../track/sectors.js';
const horizons=new Map();
const sampledRoads=new WeakMap();
function roadWindow(track,distance){
  let road=sampledRoads.get(track);
  if(!road){
    const count=Math.ceil(track.length/.22);
    road={samples:new Array(count),step:track.length/count};sampledRoads.set(track,road);
  }
  const first=Math.floor((distance-1.1)/road.step),count=road.samples.length;
  return i=>{
    const at=((first+i)%count+count)%count;
    return road.samples[at]??=track.sample(at*road.step);
  };
}
// Perspective race view for devices without WebGL. The road comes from the same
// sampled course as the physics, including banks, forks and elevated crossings.
export function drawChase(ctx, canvas, session, studio, alpha=1, view='chase') {
  const {width:w,height:h}=canvas, {track,player}=session;
  let p=player.crash??racePose(player,alpha), heading=p.launchAngle??p.guideAngle??p.angle;
  const zone=track.base?.loopZone,local=player.pose.s,side=zone&&!player.crash&&local>=zone.start-1.5&&local<=zone.end+.7;
  const drone=view==='drone';let reach=drone?.82:1.45;
  if(side){
    const i=Math.max(0,Math.min(Math.round((zone.end-zone.start)/zone.span)-1,Math.floor((local-zone.start)/zone.span)));
    p=track.sample(zone.start+(i+.5)*zone.span);
    reach=Math.max(4.8,3.8*h/w)*zone.radius;
    p={...p,z:p.z-zone.radius+reach*.22};heading=Math.atan2(-p.ny,-p.nx);
  }
  const tx=Math.cos(heading), ty=Math.sin(heading);
  const focal=Math.min(h*.97,w*1.16), pitch=side?.22:drone?.49:.32;
  function project(x,y,z){
    const ahead=(x-p.x)*tx+(y-p.y)*ty+reach, up=z-p.z-(side?0:drone?.70:.82);
    const depth=ahead*Math.cos(pitch)-up*Math.sin(pitch);
    if(depth<.12)return null;
    return {x:w*.5+((x-p.x)*ty-(y-p.y)*tx)*focal/depth,
      y:h*.49-(up*Math.cos(pitch)+ahead*Math.sin(pitch))*focal/depth,depth};
  }
  ctx.setTransform(1,0,0,1,0,0);
  const sky=ctx.createLinearGradient(0,0,0,h*.58);
  sky.addColorStop(0,'#61829b');sky.addColorStop(.75,'#d8d3ba');sky.addColorStop(1,'#658075');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle='#586854';ctx.fillRect(0,h*.48,w,h*.52);
  if(session.meeting){
    const id=session.meeting.world;
    if(!horizons.has(id)){
      const horizon=document.createElement('canvas');horizon.width=768;horizon.height=384;
      drawSector(horizon.getContext('2d'),768,384,id);horizons.set(id,horizon);
    }
    ctx.drawImage(horizons.get(id),0,0,w,h);
  }
  const shapes=[];
  function strip(a,b,left,right,color,height=0){
    const xy=(s,d)=>project(s.x+s.nx*d,s.y+s.ny*d,s.z+height-d*Math.sin(s.bank||0));
    const points=[xy(a,left),xy(b,left),xy(b,right),xy(a,right)];
    if(points.some(q=>!q))return;
    shapes.push({points,color,depth:(points[0].depth+points[1].depth)/2});
  }
  const sample=roadWindow(track,side?zone.start-2:player.distance),half=.37+track.extraWidth;
  let a=sample(0);
  for(let i=1;i<=125;i++){
    const b=sample(i);
    if(track.jump&&a.s>=track.jump.start&&a.s<track.jump.start+track.jump.length){a=b;continue;}
    for(const sign of [-1,1]){
      const offset=sign*(a.fork?.offset||0)/2;
      strip(a,b,offset,offset+sign*half,'#303941');
      strip(a,b,offset+sign*half,offset+sign*(half+.07),Math.floor(a.s/.44)%2?'#dda947':'#37414a',.045);
    }
    for(const sign of [-1,1]){
      const d=sign*(half+.063+(a.fork?.offset||0)/2);
      strip(a,b,d,d+sign*.023,'#9aa9ad',.208);
      strip(a,b,d,d+sign*.031,'#687781',.115);
    }
    if(a.tunnel){
      const wet=['coast','titan'].includes(track.theme);
      strip(a,b,-half-.22,half+.22,Math.floor(a.s/.22)%7===0?'#adfffb':wet?'#215969':'#454950',1.15);
    }
    for(const lane of track.lanes){
      const d=track.laneOffset(lane)+Math.sign(track.laneOffset(lane))*(a.fork?.offset||0)/2;
      strip(a,b,d-.014,d+.014,'#10151a',.006);
      strip(a,b,d+.02,d+.033,'#b7bdbb',.008);
    }
    a=b;
  }
  for(const car of session.cars){
    const body=car.crash??racePose(car,alpha),q=project(body.x,body.y,body.z+.055);
    if(q)shapes.push({q,depth:q.depth-.13,color:car.color,skid:car.skid,crash:car.crash,car});
  }
  shapes.sort((a,b)=>b.depth-a.depth);
  for(const s of shapes){
    ctx.fillStyle=s.color;
    if(s.q){const {x,y,depth}=s.q,size=.194*focal/depth;
      ctx.save();ctx.translate(x,y);ctx.scale(size,size);
      ctx.fillStyle='#080f17aa';ctx.beginPath();ctx.ellipse(0,.06,.61,.12,0,0,Math.PI*2);ctx.fill();
      const sprite=studio?.raceSprite(s.car,true);
      if(sprite){
        ctx.save();
        ctx.rotate(s.crash?(s.crash.roll||0):side?-(s.car.pose.loopPitch||0):Math.max(-.24,Math.min(.24,s.car.driftAngle||0)));
        ctx.drawImage(sprite,-.67,-.59,1.34,.89);ctx.restore();
      }else{
      for(const side of [-.52,.33]){ctx.fillStyle='#101720';ctx.fillRect(side,-.22,.19,.38);}
      const lacquer=ctx.createLinearGradient(0,-.48,0,.12);lacquer.addColorStop(0,'#d9edf1');lacquer.addColorStop(.26,s.color);lacquer.addColorStop(1,'#172331');
      ctx.fillStyle=lacquer;ctx.beginPath();ctx.moveTo(-.52,.06);ctx.lineTo(-.52,-.24);ctx.lineTo(-.36,-.39);ctx.lineTo(.36,-.39);ctx.lineTo(.52,-.24);ctx.lineTo(.52,.06);ctx.fill();
      ctx.fillStyle='#172630';ctx.fillRect(-.52,-.38,1.04,.065);
      }
      if(s.skid>.29){ctx.fillStyle='#e0ebed52';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*.46,.11,.17,.10,0,0,Math.PI*2);ctx.fill();}}
      if(s.crash?.wallHits || (s.skid>.37 && Math.floor(s.car.distance*22)%3===0)){ctx.strokeStyle='#ffd17c';ctx.lineWidth=.028;ctx.beginPath();for(let i=0;i<6;i++){ctx.moveTo(.44,0);ctx.lineTo(.5+i*.07,-.1-Math.abs(Math.sin(i+(s.crash?.angle||s.car.distance)))*.32);}ctx.stroke();}
      ctx.restore();
      if(!sprite){ctx.fillStyle='#263641';ctx.fillRect(x-size*.32,y-size*.56,size*.64,size*.23);
      ctx.fillStyle='#ff5448';for(const side of [-.43,.23])ctx.fillRect(x+size*side,y-size*.18,size*.2,size*.09);}
    }else{ctx.beginPath();s.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();}
  }
}
