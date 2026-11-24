import * as THREE from 'three';

// One batch of backlit arrows faces the approaching driver on the outside of each bend.
export function apexPanels(track){
 const sites=[];
 for(let s=3;s<track.length-4;s+=1){
  const p=track.sample(s);
  if(Math.abs(p.curvature)<.18 || p.bridge || p.tunnel || Math.abs(p.stuntRoll||0)>.1)continue;
  const side=-Math.sign(p.curvature);
  sites.push({p,side});s+=2;
 }
 const group=new THREE.Group();
 if(!sites.length)return group;
 for(const side of [-1,1]){
  const bends=sites.filter(s=>s.side===side);
  if(!bends.length)continue;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=48;
  const c=canvas.getContext('2d');c.fillStyle='#101a22';c.fillRect(0,0,128,48);
  c.fillStyle='#ffbe50';c.fillRect(0,0,128,2);c.fillRect(0,46,128,2);
  // Normal points towards the incoming car. Local +X is the driver's right.
  if(side>0){c.translate(128,0);c.scale(-1,1);}
  for(const x of [8,47,86]){
   c.beginPath();c.moveTo(x,7);c.lineTo(x+15,7);c.lineTo(x+33,24);
   c.lineTo(x+15,41);c.lineTo(x,41);c.lineTo(x+18,24);c.closePath();c.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.39,.15),new THREE.MeshBasicMaterial({map:texture}),bends.length);
  const pose=new THREE.Object3D();
  bends.forEach(({p},i)=>{
   const offset=side*(.56+(track.extraWidth??0));
   pose.position.set(p.x+p.nx*offset,p.z+.23,p.y+p.ny*offset);
   pose.rotation.y=Math.atan2(-p.tx,-p.ty);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);
  });
  mesh.userData.ownTexture=true;group.add(mesh);
 }
 return group;
}
