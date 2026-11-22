import * as THREE from 'three';
import { PHYSICS } from '../core/config.js';

/** Surface evidence, warning boards and braking distance markers, shared across races. */
export function courseDetails(track){
 const root=new THREE.Group(),ink=new THREE.MeshStandardMaterial({color:'#252725',roughness:.86});
 for(const zone of track.conditions??[]){
  const vertices=[],colors=[];
  let seed=track.index*677+Math.floor(zone.start*133);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<(zone.type==='damp'?34:90);i++){
   const at=zone.start+random()*zone.length,p=track.sample(at),lane=track.laneOffset(zone.lane);
   const d=lane+(random()-.5)*.22,r=zone.type==='leaves'?.012+random()*.016:.022+random()*.045;
   const x=p.x+p.nx*d,z=p.y+p.ny*d,h=p.z-d*Math.sin(p.bank||0)+.078;
   const a=random()*6.28,c=new THREE.Color(zone.color).multiplyScalar(.65+random()*.5);
   for(const [dx,dy] of [[-r,0],[0,r*.48],[r,0],[r,0],[0,-r*.48],[-r,0]]){
    vertices.push(x+Math.cos(a)*dx-Math.sin(a)*dy,h,z+Math.sin(a)*dx+Math.cos(a)*dy);colors.push(c.r,c.g,c.b);
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:zone.type==='damp'?.12:.9,metalness:zone.type==='damp'?.28:0,transparent:zone.type!=='leaves',opacity:zone.type==='damp'?.60:.82,depthWrite:zone.type==='leaves'});
  const patch=new THREE.Mesh(g,m);patch.name=zone.label;patch.receiveShadow=true;root.add(patch);
  const p=track.sample(zone.start-2),side=track.laneOffset(zone.lane)>0?1:-1;
  const label=document.createElement('canvas');label.width=384;label.height=160;
  const ctx=label.getContext('2d');ctx.fillStyle='#efd580';ctx.fillRect(0,0,384,160);ctx.fillStyle='#242620';ctx.font='900 29px sans-serif';ctx.textAlign='center';ctx.fillText(zone.short.toUpperCase(),192,58);ctx.font='bold 24px sans-serif';ctx.fillText('CORSIA '+(zone.lane+1)+' / RALLENTA',192,111);
  const tex=new THREE.CanvasTexture(label);tex.colorSpace=THREE.SRGBColorSpace;
  const board=new THREE.Mesh(new THREE.PlaneGeometry(.49,.205),new THREE.MeshStandardMaterial({map:tex,roughness:.68,side:THREE.DoubleSide}));
  board.position.set(p.x+p.nx*(.65+track.extraWidth)*side,p.z+.37,p.y+p.ny*(.65+track.extraWidth)*side);board.rotation.y=-Math.atan2(p.ty,p.tx)-Math.PI/2;board.userData.ownTexture=true;root.add(board);
  for(const d of [-.16,.16]){
   const post=new THREE.Mesh(new THREE.CylinderGeometry(.008,.009,.27,5),ink);post.position.copy(board.position);post.position.y-=.21;post.position.x+=p.nx*d;post.position.z+=p.ny*d;root.add(post);
  }
 }
 // Two measured boards before each sustained bend, on the outside shoulder.
 let last=-10;
 for(let s=4;s<track.length;s+=.25){
  const p=track.sample(s),before=track.sample(s-.8);
  if(Math.abs(p.curvature)<.18||Math.abs(before.curvature)>.08||s-last<7||track.tunnelAt?.(s,2))continue;
  last=s;
  for(const distance of [1,2]){
   const q=track.sample(s-distance),side=-Math.sign(p.curvature);
   const plate=new THREE.Mesh(new THREE.BoxGeometry(.025,.16,.13),new THREE.MeshStandardMaterial({color:distance===1?'#e25f35':'#f3e7c9',roughness:.58}));
   plate.position.set(q.x+q.nx*side*(.53+track.extraWidth),q.z+.18,q.y+q.ny*side*(.53+track.extraWidth));plate.rotation.y=-Math.atan2(q.ty,q.tx);plate.castShadow=true;root.add(plate);
  }
 }
 return root;
}
