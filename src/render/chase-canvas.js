import {racePose} from './race-pose.js';
import { drawSector } from '../track/sectors.js';
import { THEMES } from '../track/themes.js';
import {biomePhoto} from '../track/photo-biomes.js';
const photos=new Map();
function photoBackdrop(theme){
 const url=biomePhoto(theme);if(!url||typeof Image==='undefined')return null;
 if(!photos.has(url)){const image=new Image();image.src=url;photos.set(url,image);}
 const image=photos.get(url);return image.complete&&image.naturalWidth?image:null;
}
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
  const zone=track.base?.loopZone??track.base?.rollZone,local=player.pose.s,side=zone&&!player.crash&&local>=zone.start-1.5&&local<=zone.end+.7;
  const drone=view==='drone';let reach=drone?.82:1.45;
  if(side){
    const i=Math.max(0,Math.min(Math.round((zone.end-zone.start)/zone.span)-1,Math.floor((local-zone.start)/zone.span)));
    p=track.sample(zone.axial?local:zone.start+(i+.5)*zone.span);
    reach=Math.max(4.8,3.8*h/w)*zone.radius;
    p={...p,z:p.z-(zone.axial?0:zone.radius)+reach*.22};heading=Math.atan2(-p.ny,-p.nx);
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
  const palette=THEMES[track.theme]??THEMES.forest;
  sky.addColorStop(0,palette.sky);sky.addColorStop(.75,palette.accent);sky.addColorStop(1,palette.hill);
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle=palette.ground;ctx.fillRect(0,h*.48,w,h*.52);
  const photo=photoBackdrop(track.theme);
  if(photo){
    const period=Math.max(w,h*3),shift=((heading/(2*Math.PI)%1+1)%1)*period;
    ctx.save();ctx.beginPath();ctx.rect(0,0,w,h*.49);ctx.clip();
    ctx.drawImage(photo,-shift,-h*.35,period,h*1.55);
    if(period-shift<w)ctx.drawImage(photo,period-shift,-h*.35,period,h*1.55);
    ctx.restore();
  }else if(session.meeting){
    const id=session.meeting.world;
    if(!horizons.has(id)){
      const horizon=document.createElement('canvas');horizon.width=768;horizon.height=384;
      drawSector(horizon.getContext('2d'),768,384,id);horizons.set(id,horizon);
    }
    const panorama=horizons.get(id),period=Math.max(w,h*2.4),shift=((heading/(2*Math.PI)%1+1)%1)*period;
    ctx.drawImage(panorama,-shift,0,period,h);
    if(period-shift<w)ctx.drawImage(panorama,period-shift,0,period,h);
  }
  const shapes=[];
  function strip(a,b,left,right,color,height=0){
    const xy=(s,d)=>{const roll=s.stuntRoll||0,offset=d*Math.cos(roll)+height*Math.sin(roll);return project(s.x+s.nx*offset,s.y+s.ny*offset,s.z+height*Math.cos(roll)-d*Math.sin((s.bank||0)+roll));};
    const points=[xy(a,left),xy(b,left),xy(b,right),xy(a,right)];
    if(points.some(q=>!q))return;
    shapes.push({points,color,depth:(points[0].depth+points[1].depth)/2});
  }
  const sample=roadWindow(track,side?zone.start-2:player.distance),half=.37+track.extraWidth;
  const laneOffsets=track.lanes.map(lane=>track.laneOffset(lane));
  const wetRail=track.weather==='rain';
  let a=sample(0);
  for(let i=1;i<=125;i++){
    const b=sample(i);
    if(track.jump&&a.s>=track.jump.start&&a.s<track.jump.start+track.jump.length){a=b;continue;}
    for(const sign of [-1,1]){
      const offset=sign*(a.fork?.offset||0)/2;
      strip(a,b,offset,offset+sign*half,track.weather==='rain'&&!a.tunnel?'#344955':'#303941');
      strip(a,b,offset+sign*half,offset+sign*(half+.07),Math.floor(a.s/.44)%2?'#dda947':'#37414a',.045);
    }
    for(const sign of [-1,1]){
      const d=sign*(half+.063+(a.fork?.offset||0)/2);
      strip(a,b,d,d+sign*.023,'#9aa9ad',.208);
      strip(a,b,d,d+sign*.031,'#687781',.115);
    }
    if(a.tunnel){
      const wet=['coast','titan'].includes(track.theme);
      strip(a,b,-half-.22,half+.22,Math.floor(a.s/.22)%3===0?['#9bd7d7','#a8c6eb','#dda375'][Math.floor(a.s/2)%3]:wet?'#215969':'#454950',1.15);
    }
    const bend=track.base?.hairpins?.find(t=>a.s>=t.start-1&&a.s<t.end+1);
    if(bend){
      const outer=-Math.sign(track.sample(bend.start+.12).curvature);
      strip(a,b,outer*(half+.015),outer*(half+.077),Math.floor(a.s/.18)%4===0?'#f2e8cd':bend.climb?'#cc792b':'#338e9a',.084);
    }
    const deposit=track.conditions.find(z=>(z.type==='snow'||z.type==='sand')&&a.s>=z.start&&a.s<z.start+z.length);
    if(deposit){
      const d=track.laneOffset(deposit.lane), wave=Math.sin(a.s*9)*.017;
      strip(a,b,d-.10+wave,d+.08+wave,deposit.type==='snow'?'#d4e1e4':'#bb986b',.004);
    }
    if(track.weather==='rain'&&!a.tunnel&&!a.stuntRoll&&!a.loopMetric){
      const seed=Math.floor(a.s*100),d=Math.sin(seed*4.72)*half*.92;
      const t=((session.elapsed||0)*2.15+(seed*.618)%1)%1;
      const h=t<.76?1.65*(1-t/.76):.004;
      const x=a.x+d*a.nx,y=a.y+d*a.ny,z=a.z+.082-d*Math.sin(a.bank||0);
      const impact=project(x+h*.10,y,z+h);
      if(impact)shapes.push({rain:impact,t,depth:impact.depth-.003});
    }
    // The bevel catches a broad sky highlight as its bearing turns around a bend.
    const shine=(a.nx*.64+a.ny*.77)**2;
    const steel=shine>.78?(wetRail?'#e1f1f7':'#d6dfdf'):shine>.35?'#a9babf':'#91a0a7';
    for(const offset of laneOffsets){
      const d=offset+Math.sign(offset)*(a.fork?.offset||0)/2;
      strip(a,b,d-.014,d+.014,'#10151a',.006);
      strip(a,b,d+.02,d+.033,steel,.008);
    }
    a=b;
  }
  for(const car of session.cars){
    const body=car.crash??racePose(car,alpha),q=project(body.x,body.y,body.z+.055);
    if(q)shapes.push({q,depth:q.depth-.13,color:car.color,skid:car.skid,crash:car.crash,car});
  }
  shapes.sort((a,b)=>b.depth-a.depth);
  for(const s of shapes){
    if(s.rain){
      const {x,y,depth}=s.rain,k=focal/depth;
      ctx.beginPath();ctx.strokeStyle='#c4e2f28a';ctx.lineWidth=Math.min(2,Math.max(.6,k*.002));
      if(s.t<.76){ctx.moveTo(x,y);ctx.lineTo(x+k*.005,y+k*.052);}
      else{const r=k*(.009+.046*(s.t-.76)/.24);ctx.ellipse(x,y,r,r*.28,0,0,Math.PI*2);}
      ctx.stroke();continue;
    }
    ctx.fillStyle=s.color;
    if(s.q){const {x,y,depth}=s.q,size=.194*focal/depth;
      ctx.save();ctx.translate(x,y);ctx.scale(size,size);
      ctx.fillStyle='#080f17aa';ctx.beginPath();ctx.ellipse(0,.06,.61,.12,0,0,Math.PI*2);ctx.fill();
      const sprite=studio?.raceSprite(s.car,true);
      if(sprite){
        ctx.save();
        ctx.rotate(s.crash?(s.crash.roll||0):side?(s.car.pose.stuntRoll||-(s.car.pose.loopPitch||0)):Math.max(-.24,Math.min(.24,s.car.driftAngle||0)));
        ctx.drawImage(sprite,-.67,-.59,1.34,.89);ctx.restore();
      }else{
      for(const side of [-.52,.33]){ctx.fillStyle='#101720';ctx.fillRect(side,-.22,.19,.38);}
      const lacquer=ctx.createLinearGradient(0,-.48,0,.12);lacquer.addColorStop(0,'#d9edf1');lacquer.addColorStop(.26,s.color);lacquer.addColorStop(1,'#172331');
      ctx.fillStyle=lacquer;ctx.beginPath();ctx.moveTo(-.52,.06);ctx.lineTo(-.52,-.24);ctx.lineTo(-.36,-.39);ctx.lineTo(.36,-.39);ctx.lineTo(.52,-.24);ctx.lineTo(.52,.06);ctx.fill();
      ctx.fillStyle='#172630';ctx.fillRect(-.52,-.38,1.04,.065);
      }
      if(s.skid>.29){for(const flank of [-1,1]){const drift=(s.car.distance*.83)%1,r=.22+drift*.16,x=flank*(.43+drift*.12),y=.08-drift*.12;
        const mist=ctx.createRadialGradient(x,y,0,x,y,r);mist.addColorStop(0,'#e1e5e48a');mist.addColorStop(.48,'#c4c9ca43');mist.addColorStop(1,'#afb8bd00');ctx.fillStyle=mist;ctx.fillRect(x-r,y-r,r*2,r*2);}}
      if(s.crash?.wallHits || (s.skid>.37 && Math.floor(s.car.distance*22)%3===0)){ctx.strokeStyle='#ffd17c';ctx.lineWidth=.028;ctx.beginPath();for(let i=0;i<6;i++){ctx.moveTo(.44,0);ctx.lineTo(.5+i*.07,-.1-Math.abs(Math.sin(i+(s.crash?.angle||s.car.distance)))*.32);}ctx.stroke();}
      ctx.restore();
      if(!sprite){ctx.fillStyle='#263641';ctx.fillRect(x-size*.32,y-size*.56,size*.64,size*.23);
      ctx.fillStyle='#ff5448';for(const side of [-.43,.23])ctx.fillRect(x+size*side,y-size*.18,size*.2,size*.09);}
    }else{ctx.beginPath();s.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();}
  }
}
