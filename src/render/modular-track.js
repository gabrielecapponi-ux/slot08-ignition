import * as THREE from 'three';
import { PHYSICS } from '../core/config.js';

/** Longer circuits reuse the Blender GT while building their modular toy road
 * from the exact simulation path. Geometry is constructed only on track change. */
export function buildModularTrack(track) {
  const root = new THREE.Group(), n = Math.ceil(track.length / .12);
  const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness ? .32 : .83, side: THREE.DoubleSide });
  const asphalt = mat('#292e35'), rail = mat('#b8c1c3', .85), slot = mat('#090e14'), red = mat('#e86249'), white = mat('#f4e8cf');
  function ribbon(left, right, height, material, sample = s => track.sample(s), start = 0, length = track.length, steps = n) {
    const vertices = [], indices = [];
    for (let i = 0; i <= steps; i++) {
      const p = sample(start + i / steps * length);
      for (const d of [left,right]) vertices.push(p.x + p.nx * d, p.z + height, p.y + p.ny * d);
      if (i < steps) { const a = i * 2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,material); mesh.receiveShadow = true; root.add(mesh);
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
    for (const s of cells) { const p=track.sample(s); for(const side of [-1,1]) {transform.position.set(p.x+p.nx*side*.35,p.z+.085,p.y+p.ny*side*.35);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();mesh.setMatrixAt(j++,transform.matrix);} }
    mesh.receiveShadow=true;root.add(mesh);
  }
  const seamCount=Math.floor(track.length/1.2), seams=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.002,.68),slot,seamCount);
  for(let i=0;i<seamCount;i++){const p=track.sample(i*1.2);transform.position.set(p.x,p.z+.079,p.y);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();seams.setMatrixAt(i,transform.matrix);} root.add(seams);
  for(const gate of track.switches) for(const lane of [0,1]) {
    const change={from:lane,to:1-lane,start:gate.start,length:gate.end-gate.start};
    const sample=s=>{const p=track.pose(s,lane,change);return {...p,nx:-p.ty,ny:p.tx};};
    ribbon(-.013,.013,.079,slot,sample,gate.start,change.length,50);
    for(const side of [-1,1])ribbon(side*.026-.005,side*.026+.005,.080,rail,sample,gate.start,change.length,50);
  }
  const p=track.sample(.08), checker=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.003,.0875),white,8);
  for(let i=0;i<8;i++){const d=(i-3.5)*.0875,along=i%2*.09;transform.position.set(p.x+p.nx*d+p.tx*along,p.z+.082,p.y+p.ny*d+p.ty*along);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();checker.setMatrixAt(i,transform.matrix);}root.add(checker);
  const b=track.bounds,board=new THREE.Mesh(new THREE.BoxGeometry(b.maxX-b.minX+.8,.32,b.maxY-b.minY+.8),mat(track.level.board));
  board.position.set((b.minX+b.maxX)/2,-.17,(b.minY+b.maxY)/2);board.receiveShadow=true;root.add(board);
  // Trackside objects provide optic flow on the long straights. Instancing keeps
  // draw calls constant even on the 196 m finale; every prop stays outside the slot.
  const posts=[];for(let s=3;s<track.length;s+=4){const p=track.sample(s);for(const side of [-1,1])posts.push({...p,side});}
  const poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.025,.64,6),rail,posts.length);
  const flags=new THREE.InstancedMesh(new THREE.BoxGeometry(.26,.16,.012),new THREE.MeshStandardMaterial({color:track.level.color,emissive:track.level.color,emissiveIntensity:.12,roughness:.6}),posts.length);
  transform.scale.set(1,1,1);
  posts.forEach((p,i)=>{const x=p.x+p.nx*p.side*.72,y=p.y+p.ny*p.side*.72;transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.position.set(x,p.z+.32,y);transform.updateMatrix();poles.setMatrixAt(i,transform.matrix);transform.position.set(x+p.tx*.1,p.z+.57,y+p.ty*.1);transform.updateMatrix();flags.setMatrixAt(i,transform.matrix);});root.add(poles,flags);
  // Bridge trestles stay underneath the road, out of the driver's sightline.
  const supports=[];for(let s=0;s<track.length;s+=1.8){const p=track.sample(s);if(p.z>.12)supports.push(p);}
  if(supports.length){const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,1,.58),mat('#e87842'),supports.length);supports.forEach((p,i)=>{transform.position.set(p.x,p.z/2,p.y);transform.scale.set(1,p.z,1);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});mesh.castShadow=true;root.add(mesh);}
  return root;
}
