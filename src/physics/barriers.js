/** Shared dimensions for the visible steel beam and physical swept contacts. */
export const BARRIER=Object.freeze({offset:.415,bottom:.095,top:.23,carRadius:.073,restitution:.28});
export function collideBarriers(crash,previous,samples,extraWidth=0){
 let contact=null;
 for(const p of samples){
  const along=(crash.x-p.x)*p.tx+(crash.y-p.y)*p.ty;
  if(Math.abs(along)>.19)continue;
  const bank=p.bank||0,span=(BARRIER.offset+extraWidth+(p.fork?.offset||0)/2)*Math.cos(bank);
  const before=(previous.x-p.x)*p.nx+(previous.y-p.y)*p.ny;
  const after=(crash.x-p.x)*p.nx+(crash.y-p.y)*p.ny;
  const spread=(p.fork?.offset||0)/2;
  const walls=[[-span,-1],[span,1]];if(spread>.08)walls.push([-spread-.018,1],[spread+.018,-1]);
  for(const [wall,side] of walls){
   const heading=Number.isFinite(crash.angle)?crash.angle:Math.atan2(p.ty,p.tx);
   const cross=Math.abs(Math.cos(heading)*p.nx+Math.sin(heading)*p.ny);
   const radius=.145*cross+BARRIER.carRadius*Math.sqrt(Math.max(0,1-cross*cross));
   const limit=side*wall-radius,velocity=side*(crash.vx*p.nx+crash.vy*p.ny);
   if(side*before>side*wall+.025||side*after<limit)continue;
   const base=p.z-wall*Math.sin(bank);
   if(Math.min(previous.z,crash.z)>base+BARRIER.top||Math.max(previous.z,crash.z)+.10<base+BARRIER.bottom)continue;
   const penetration=side*after-limit;
   if(!contact||penetration>contact.penetration)contact={p,side,velocity:Math.max(0,velocity),penetration};
  }
 }
 if(!contact)return false;
 const {p,side,velocity,penetration}=contact;
 crash.x-=p.nx*side*(penetration+.0001);crash.y-=p.ny*side*(penetration+.0001);
 crash.vx-=p.nx*side*velocity*(1+BARRIER.restitution);crash.vy-=p.ny*side*velocity*(1+BARRIER.restitution);
 crash.vx*=.88;crash.vy*=.88;crash.spin*=.48;crash.rollSpeed*=.35;
 crash.vz=Math.min(.32,Math.max(0,crash.vz)+velocity*.045);
 crash.contacts=(crash.contacts||0)+1;crash.wallHits=(crash.wallHits||0)+1;
 return true;
}
