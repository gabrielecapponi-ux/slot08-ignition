/** Deliberate scenery placement with enough room for the full model footprint.
 * The clearance is checked against both branches and all decks of a circuit. */
export function landmarkPlacements(track,field,kit){
 if(!kit)return[];
 const theme=track.theme,b=track.bounds,cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;
 const plan=theme==='night'?[['neon_hotel15',1.2],['neon_tower15',1.4],['neon_hotel15',1],['neon_hotel15',.85],['neon_tower15',1.05],['neon_hotel15',1.1]]:
  theme==='alpine'?[['alpine_cliff15',1.1],['cascade15',.85],['alpine_cliff15',.75]]:
  theme==='forest'?[['cascade15',1.05],['alpine_cliff15',.62]]:
  theme==='harbor'?[['neon_hotel15',.85],['neon_tower15',.9]]:[];
 const out=[];
 for(const [index,[name,scale]]of plan.entries()){
  const key='PROP_'+name;if(!kit.items.has(key))continue;
  const size=kit.footprint(key)*scale;
  // Prefer landmarks across the far half of the scene, leaving near views open.
  const candidates=[];
  for(let j=0;j<96;j++){
   const a=2*Math.PI*(j/96+.618*index),rx=(b.maxX-b.minX)/2+2.6,ry=(b.maxY-b.minY)/2+2.6;
   const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;
   if(x-size<b.minX-4.8||x+size>b.maxX+4.8||y-size<b.minY-4.8||y+size>b.maxY+4.8)continue;
   if(field.distance(x,y)<size+.64+(track.extraWidth||0))continue;
   if(out.some(p=>Math.hypot(p.x-x,p.y-y)<p.size+size+.25))continue;
   const z=field.height(x,y);
   candidates.push({name,key,x,y,z:z-.015,foundationZ:z-.015,size,scale,angle:Math.atan2(cx-x,cy-y),score:y-cy+Math.sin(j*2.9+index)*2});
  }
  candidates.sort((a,b)=>a.score-b.score);if(candidates[0])out.push(candidates[0]);
 }
 return out;
}

export function levelLandmarkFoundations(terrain,placements){
 const positions=terrain.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getZ(i);
  for(const p of placements){
   const d=Math.hypot(x-p.x,y-p.y),inner=p.size*.92,outer=p.size*1.22;
   if(d>=outer)continue;
   let t=Math.max(0,Math.min(1,(outer-d)/(outer-inner)));t=t*t*(3-2*t);
   positions.setY(i,positions.getY(i)*(1-t)+(p.foundationZ-.002)*t);
  }
 }
 positions.needsUpdate=true;terrain.geometry.computeVertexNormals();
}
