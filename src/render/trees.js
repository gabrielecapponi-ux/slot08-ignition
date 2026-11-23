import * as THREE from 'three';

// Build one mesh of wood and one of foliage per species, shared across the stand.
export function plantStand(species,sites,parent,weather){
 if(!sites?.length)return;
 let seed=species==='oak'?844:species==='pine'?819:812;
 const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const wood=[],leaves=[],tones=[],v=(x,y,z)=>new THREE.Vector3(x,y,z);
 const tri=(arr,a,b,c)=>arr.push(...a.toArray(),...b.toArray(),...c.toArray());
 function branch(a,b,r0,r1){
  const axis=b.clone().sub(a).normalize(),u=axis.clone().cross(v(0,0,1)).normalize(),w=axis.clone().cross(u);
  const ring=(base,r,i)=>base.clone().addScaledVector(u,r*Math.cos(i*Math.PI/3)).addScaledVector(w,r*Math.sin(i*Math.PI/3));
  for(let i=0;i<6;i++){const p=ring(a,r0,i),q=ring(a,r0,i+1),c=ring(b,r1,i),d=ring(b,r1,i+1);tri(wood,p,q,c);tri(wood,q,d,c);}
 }
 function leaf(a,b,width,tint){
  const axis=b.clone().sub(a),side=v(-axis.z,0,axis.x).normalize().multiplyScalar(width);
  const mid=a.clone().lerp(b,.48);mid.y+=width*.4;
  tri(leaves,a,mid.clone().add(side),b);tri(leaves,b,mid.clone().sub(side),a);
  const color=new THREE.Color(tint).multiplyScalar(.74+random()*.44);
  for(let i=0;i<6;i++)tones.push(color.r,color.g,color.b);
 }
 const height=species==='pine'?1.75:1.42,oak=species==='oak';
 branch(v(0,0,0),v(.025,height,0),oak?.065:.047,.012);
 const count=oak?38:species==='pine'?66:16;
 for(let i=0;i<count;i++){
  const t=i/count,angle=i*2.39996+random()*.22,dx=Math.cos(angle),dz=Math.sin(angle);
  const base=oak?.45+t*.88:species==='pine'?.32+t*1.39:height-.09+t*.08;
  const reach=oak?.51*Math.sqrt(1-(t-.30)**2):species==='pine'?.56*(1-t)+.05:.55+random()*.18;
  const rise=oak?.23:species==='pine'?-.06:.24;
  const a=v(.016,base,0),b=v(dx*reach*.55,base+rise,dz*reach*.55),tip=v(dx*reach,base+rise+(oak?.12:-.13),dz*reach);
  branch(a,b,oak?.026:.012,.011);branch(b,tip,.012,.004);
  for(let k=0;k<(oak?52:28);k++){
   const along=random(),stem=b.clone().lerp(tip,along),side=k%2?1:-1;
   if(oak){
    const theta=random()*6.283,r=.19*Math.sqrt(random());stem.add(v(r*Math.cos(theta),(random()-.5)*.20,r*Math.sin(theta)));
    leaf(stem,stem.clone().add(v(.09*Math.cos(theta),.02-random()*.07,.09*Math.sin(theta))),.036,stem.y>1?'#769552':'#547843');
   }else{
    if(along<.5)stem.copy(a).lerp(b,along*2);else stem.copy(b).lerp(tip,along*2-1);
    const span=(1-along*.85)*(species==='pine'?.13:.22);
    leaf(stem,stem.clone().add(v(dx*.07-dz*span*side,-span*.44,dz*.07+dx*span*side)),species==='pine'?.041:.021,species==='pine'?'#446e51':'#69984d');
   }
  }
 }
 const mesh=(vertices,colors,material)=>{
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  if(colors)geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const obj=new THREE.InstancedMesh(geo,material,sites.length),pose=new THREE.Object3D();
  sites.forEach((p,i)=>{pose.position.set(p.x,p.z??0,p.y);pose.rotation.y=p.angle??0;pose.scale.setScalar(p.scale??1);pose.updateMatrix();obj.setMatrixAt(i,pose.matrix);});
  obj.castShadow=true;obj.receiveShadow=true;obj.name=species;parent.add(obj);
 };
 mesh(wood,null,new THREE.MeshStandardMaterial({color:weather==='rain'?'#514135':'#76604a',side:THREE.DoubleSide,roughness:.93}));
 mesh(leaves,tones,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:weather==='rain'?.48:.84}));
}
