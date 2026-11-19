import * as THREE from 'three';
import { PHYSICS } from '../core/config.js';

/** Longer circuits reuse the Blender GT while building their modular toy road
 * from the exact simulation path. Geometry is constructed only on track change. */
export function buildModularTrack(track) {
  const root = new THREE.Group(), n = Math.ceil(track.length / .09);
  const position=(p,d,h)=>[p.x+p.nx*d*Math.cos(p.bank||0),p.z-d*Math.sin(p.bank||0)+h,p.y+p.ny*d*Math.cos(p.bank||0)];
  const orient=(object,p)=>{object.rotation.order='YZX';object.rotation.set(p.bank||0,-Math.atan2(p.ty,p.tx),Math.atan(p.grade||0));};
  const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness ? .32 : .83, side: THREE.DoubleSide });
  const asphalt = mat('#292e35'), rail = mat('#b8c1c3', .85), slot = mat('#090e14'), red = mat('#e86249'), white = mat('#f4e8cf');
  function ribbon(left, right, height, material, sample = s => track.sample(s), start = 0, length = track.length, steps = n) {
    const vertices = [], indices = [];
    for (let i = 0; i <= steps; i++) {
      const p = sample(start + i / steps * length);
      for (const d of [left,right]) vertices.push(...position(p,d,height));
      if (i < steps) { const a = i * 2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,material); mesh.receiveShadow = true;mesh.castShadow=material===asphalt;root.add(mesh);
  }
  ribbon(-.38,.38,.058,slot); ribbon(-.35,.35,.075,asphalt);
  for (const lane of [-PHYSICS.laneOffset,PHYSICS.laneOffset]) {
    ribbon(lane-.016,lane+.016,.077,slot);
    for (const side of [-1,1]) ribbon(lane+side*.026-.006,lane+side*.026+.006,.078,rail);
  }
  const curves = [];
  for (let s = 0; s < track.length; s += .22) if (Math.abs(track.sample(s).curvature) > .05) curves.push(s);
  const box = new THREE.BoxGeometry(.22,.034,.065), transform = new THREE.Object3D();
  for (let phase=0; phase<2; phase++) {
    const cells=curves.filter((_,i)=>i%2===phase), mesh=new THREE.InstancedMesh(box,phase?white:red,cells.length*2); let j=0;
    for (const s of cells) { const p=track.sample(s); for(const side of [-1,1]) {transform.position.set(...position(p,side*.35,.085));orient(transform,p);transform.updateMatrix();mesh.setMatrixAt(j++,transform.matrix);} }
    mesh.receiveShadow=true;root.add(mesh);
  }
  const seamCount=Math.floor(track.length/1.2), seams=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.002,.68),slot,seamCount);
  for(let i=0;i<seamCount;i++){const p=track.sample(i*1.2);transform.position.set(p.x,p.z+.079,p.y);orient(transform,p);transform.updateMatrix();seams.setMatrixAt(i,transform.matrix);} root.add(seams);
  for(const gate of track.switches) for(const lane of [0,1]) {
    const change={from:lane,to:1-lane,start:gate.start,length:gate.end-gate.start};
    const sample=s=>{const p=track.pose(s,lane,change);return {...p,nx:-p.ty,ny:p.tx};};
    ribbon(-.013,.013,.079,slot,sample,gate.start,change.length,50);
    for(const side of [-1,1])ribbon(side*.026-.005,side*.026+.005,.080,rail,sample,gate.start,change.length,50);
  }
  const p=track.sample(.08), checker=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.003,.0875),white,8);
  for(let i=0;i<8;i++){const d=(i-3.5)*.0875,along=i%2*.09;transform.position.set(p.x+p.nx*d+p.tx*along,p.z+.082,p.y+p.ny*d+p.ty*along);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();checker.setMatrixAt(i,transform.matrix);}root.add(checker);
  // Safety rails and bridge columns follow the actual banked, elevated surface.
  const posts=[];for(let s=0;s<track.length;s+=.65){const p=track.sample(s);if(Math.abs(p.curvature)>.06||p.z>.18)for(const side of [-1,1])posts.push({p,side});}
  const stanchions=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.014,.16,6),rail,posts.length);
  posts.forEach(({p,side},i)=>{transform.position.set(...position(p,side*.415,.15));transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();stanchions.setMatrixAt(i,transform.matrix);});root.add(stanchions);
  for(const side of [-1,1])ribbon(side*.415-.017,side*.415+.017,.23,rail);
  const roadPoints=Array.from({length:Math.ceil(track.length/.2)},(_,i)=>track.sample(i*.2));
  const supports=[];for(let s=0;s<track.length;s+=1.6){const p=track.sample(s);if(p.z>.25)for(const side of [-1,1]){const x=p.x+p.nx*side*.53,y=p.y+p.ny*side*.53;if(!roadPoints.some(q=>q.z<p.z-.4&&Math.hypot(q.x-x,q.y-y)<.55))supports.push({p,side});}}
  const supportsMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.07,1,8),mat('#a99c83'),supports.length);
  supports.forEach(({p,side},i)=>{transform.position.set(p.x+p.nx*side*.53,p.z/2,p.y+p.ny*side*.53);transform.scale.set(1,p.z,1);transform.rotation.set(0,0,0);transform.updateMatrix();supportsMesh.setMatrixAt(i,transform.matrix);});supportsMesh.castShadow=true;supportsMesh.receiveShadow=true;root.add(supportsMesh);
  // A readable start gantry and illuminated edge markers give every circuit its own identity.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=768;labelCanvas.height=160;
  const ctx=labelCanvas.getContext('2d');ctx.fillStyle=track.theme==='night'?'#162f44':'#183c34';ctx.fillRect(0,0,768,160);ctx.fillStyle='#d9f1a5';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('SLOT 08 / WORLDS',384,46);ctx.fillStyle='#ffffff';ctx.font='bold 37px sans-serif';ctx.fillText(track.level.name.toUpperCase(),384,110,710);
  const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const gate=track.sample(4.4),angle=-Math.atan2(gate.ty,gate.tx),sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.31),new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.25,side:THREE.DoubleSide,roughness:.7}));sign.position.set(gate.x,gate.z+1.36,gate.y);sign.rotation.y=angle-Math.PI/2;sign.userData.ownTexture=true;root.add(sign);
  const gatePosts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.035,1.4,8),rail,2);[-1,1].forEach((side,i)=>{transform.position.set(gate.x+gate.nx*side*.75,gate.z+.7,gate.y+gate.ny*side*.75);transform.scale.set(1,1,1);transform.rotation.set(0,0,0);transform.updateMatrix();gatePosts.setMatrixAt(i,transform.matrix);});root.add(gatePosts);
  const lamps=[];for(let s=7;s<track.length;s+=7){const p=track.sample(s);if(!track.tunnelAt?.(s,1))lamps.push(p);}
  const glow=new THREE.MeshStandardMaterial({color:track.theme==='night'?'#95fff0':'#ffe8b4',emissive:track.theme==='night'?'#58dccb':'#ffcc7d',emissiveIntensity:track.theme==='night'?2:.4});
  const lampsMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.045,.35,.045),glow,lamps.length*2);let lamp=0;for(const p of lamps)for(const side of[-1,1]){transform.position.set(...position(p,side*.49,.25));transform.rotation.set(0,0,0);transform.updateMatrix();lampsMesh.setMatrixAt(lamp++,transform.matrix);}root.add(lampsMesh);
  return root;
}
