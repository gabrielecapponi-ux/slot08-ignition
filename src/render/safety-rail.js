import * as THREE from 'three';
import {barrierPixel} from './material-grain.js';
import { BARRIER } from '../physics/barriers.js';

// One coordinate convention for road shoulders, barriers and their anchors.
export function trackPoint(p,offset,height=0,forkSide=Math.sign(offset)) {
 const d=offset+forkSide*(p.fork?.offset||0)/2,bank=p.bank||0;
 return new THREE.Vector3(p.x+p.nx*d*Math.cos(bank),p.z-d*Math.sin(bank)+height,p.y+p.ny*d*Math.cos(bank));
}

function hazardMap(){
 const n=256,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  data.set([...barrierPixel(x,y),255],(x+y*n)*4);
 }
 const t=new THREE.DataTexture(data,n,n);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;
}

/** Closed W-section steel, opaque enamel, recessed posts and bolted base shoes.
 * The road-facing surface follows the same envelope as collideBarriers. */
export function buildSafetyRail(track){
 const root=new THREE.Group();root.name='Aegis 08 · barriere continue';
 const e=track.extraWidth||0,texture=hazardMap();
 const enamel=new THREE.MeshPhysicalMaterial({name:'Acciaio nero e giallo smaltato',map:texture,metalness:.66,roughness:.34,clearcoat:.55,clearcoatRoughness:.24});
 const steel=new THREE.MeshStandardMaterial({name:'Acciaio zincato satinato',color:'#c3cbd0',metalness:.86,roughness:.23});
 const graphite=new THREE.MeshStandardMaterial({name:'Montanti in acciaio grafite',color:'#242d32',metalness:.72,roughness:.32});
 const yellow=new THREE.MeshPhysicalMaterial({name:'Rifrangenti ambra',color:'#ffc72c',metalness:.26,roughness:.20,clearcoat:.8,emissive:'#ffa000',emissiveIntensity:.12});
 const placements=[];
 // The corrugations have real depth. The inner lip is at the collision plane.
 const section=[[0,.095],[.008,.101],[.020,.116],[.012,.138],[.017,.160],[.012,.181],[.020,.207],[.010,.225],[0,.230],[.027,.230],[.034,.219],[.035,.105],[.028,.095]];
 function sweep(side,inside=false){
  const start=inside?track.fork.start:0,end=inside?track.fork.end:track.length,steps=Math.ceil((end-start)/.06);
  const verts=[],uv=[],indices=[],d0=inside?side*.018:side*(BARRIER.offset+e),outward=inside?-side:side;
  for(let i=0;i<=steps;i++){
   const s=start+(end-start)*i/steps,p=track.sample(s),lift=inside?THREE.MathUtils.smoothstep(p.fork?.offset||0,.06,.20):1;
   for(const [d,h] of section){
    const point=trackPoint(p,d0+outward*d,.077+(h-.077)*lift,side);
    verts.push(...point);uv.push(s/1.2,(h-.095)/.135);
   }
   if(i<steps)for(let j=0;j<section.length;j++){
    const a=i*section.length+j,b=i*section.length+(j+1)%section.length,c=a+section.length,k=b+section.length;
    if(outward>0)indices.push(a,b,c,b,k,c);else indices.push(a,c,b,b,c,k);
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  // Double sided rendering is unnecessary for the closed extruded rail.
  const mesh=new THREE.Mesh(g,enamel);mesh.name=inside?'Barriera interna bivio':'Guardrail Aegis 08';mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData.ownTexture=!root.children.length;root.add(mesh);
  for(let s=start+.25;s<end-.18;s+=.62){const p=track.sample(s);if(inside&&(p.fork?.offset||0)<.23)continue;placements.push({p,side:outward,offset:d0+(inside?side*.036:outward*.044),forkSide:side,inner:inside});}
 }
 for(const side of [-1,1])sweep(side);
 if(track.fork)for(const side of [-1,1])sweep(side,true);
 const dummy=new THREE.Object3D();
 const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.202,.028),graphite,placements.length);
 const shoes=new THREE.InstancedMesh(new THREE.BoxGeometry(.070,.008,.075),steel,placements.length);
 const bolts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.005,.0055,.005,6),steel,placements.length*2);
 const reflectors=new THREE.InstancedMesh(new THREE.BoxGeometry(.027,.032,.006),yellow,placements.length);
 placements.forEach(({p,offset,side,forkSide},i)=>{
  const angle=-Math.atan2(p.ty,p.tx);
  dummy.rotation.set(0,angle,0);dummy.position.copy(trackPoint(p,offset,.132,forkSide));dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
  // Base shoes are on the shoulder at .028 m, posts start at .031 m.
  dummy.rotation.order='YZX';dummy.rotation.set(p.bank||0,angle,Math.atan(p.grade||0));
  dummy.position.copy(trackPoint(p,offset,.032,forkSide));dummy.updateMatrix();shoes.setMatrixAt(i,dummy.matrix);
  for(let j=0;j<2;j++){
   dummy.position.copy(trackPoint(p,offset,.039,forkSide));dummy.position.x+=p.tx*(j?.023:-.023);dummy.position.z+=p.ty*(j?.023:-.023);dummy.updateMatrix();bolts.setMatrixAt(i*2+j,dummy.matrix);
  }
  dummy.rotation.set(0,angle,0);dummy.position.copy(trackPoint(p,offset-side*.046,.198,forkSide));dummy.updateMatrix();reflectors.setMatrixAt(i,dummy.matrix);
 });
 posts.name='Montanti ancorati';shoes.name='Piedini imbullonati';bolts.name='Bulloni dei montanti';reflectors.name='Catadiottri ambra';
 for(const mesh of [posts,shoes,bolts,reflectors]){mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 root.userData.postPlacements=placements.map(({p,offset,forkSide})=>({foot:trackPoint(p,offset,.031,forkSide).toArray(),top:trackPoint(p,offset,.233,forkSide).toArray()}));
 return root;
}
