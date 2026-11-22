import { drawSector } from '../track/sectors.js';
const horizons=new Map();
// Perspective race view for devices without WebGL. The road comes from the same
// sampled course as the physics, including banks, forks and elevated crossings.
export function drawChase(ctx, canvas, session) {
  const {width:w,height:h}=canvas, {track,player}=session;
  const p=player.crash??player.pose, heading=p.launchAngle??p.angle;
  const tx=Math.cos(heading), ty=Math.sin(heading);
  const focal=Math.min(h*.97,w*1.16), pitch=.32;
  function project(x,y,z){
    const ahead=(x-p.x)*tx+(y-p.y)*ty+1.45, up=z-p.z-.82;
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
  const step=.22, half=.37+track.extraWidth;
  let a=track.sample(player.distance-1.1);
  for(let i=1;i<=125;i++){
    const b=track.sample(player.distance-1.1+i*step);
    for(const sign of [-1,1]){
      const offset=sign*(a.fork?.offset||0)/2;
      strip(a,b,offset,offset+sign*half,'#303941');
      strip(a,b,offset+sign*half,offset+sign*(half+.07),i%4<2?'#f0c76a':'#413e39',.045);
    }
    for(const lane of track.lanes){
      const d=track.laneOffset(lane)+Math.sign(track.laneOffset(lane))*(a.fork?.offset||0)/2;
      strip(a,b,d-.014,d+.014,'#10151a',.006);
      strip(a,b,d+.02,d+.033,'#b7bdbb',.008);
    }
    a=b;
  }
  for(const car of session.cars){
    const body=car.crash??car.pose,q=project(body.x,body.y,body.z+.055);
    if(q)shapes.push({q,depth:q.depth-.13,color:car.color});
  }
  shapes.sort((a,b)=>b.depth-a.depth);
  for(const s of shapes){
    ctx.fillStyle=s.color;
    if(s.q){const {x,y,depth}=s.q,size=.17*focal/depth;
      ctx.fillRect(x-size*.5,y-size*.35,size,size*.43);
      ctx.fillStyle='#263641';ctx.fillRect(x-size*.32,y-size*.56,size*.64,size*.23);
      ctx.fillStyle='#ff5448';for(const side of [-.43,.23])ctx.fillRect(x+size*side,y-size*.18,size*.2,size*.09);
    }else{ctx.beginPath();s.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();}
  }
}
