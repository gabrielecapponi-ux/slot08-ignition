import {sidewallPrint} from './sidewall.js';
import {finishTyres} from './paint-finish.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
/** Shared Blender meshes. Consumers own instances, never the underlying buffers. */
function finishAssembly(root){
 if(root.name.startsWith('PART_wheels_')&&root.children.length===4){
   for(const hub of root.children)sidewallPrint(hub);
 }
 if(root.name==='PART_hood_5'){
   const alloy=new THREE.MeshStandardMaterial({color:'#afc0c8',metalness:.78,roughness:.23});
   const tube=new THREE.TorusGeometry(.008,.0028,8,22);
   for(const side of [-1,1]){
     const trumpet=new THREE.Mesh(tube,alloy);
     trumpet.rotation.y=Math.PI/2;trumpet.position.set(.094,.104,side*.012);
     root.add(trumpet);
   }
 }else if(root.name==='PART_lights_9'){
   const glass=new THREE.MeshPhysicalMaterial({color:'#ffe6a8',clearcoat:1,roughness:.15,emissive:'#eac16a',emissiveIntensity:.4});
   const lens=new THREE.SphereGeometry(.009,14,10);
   for(const z of [-.037,-.013,.013,.037]){
     const optic=new THREE.Mesh(lens,glass);optic.scale.x=.55;optic.position.set(.104,.110,z);root.add(optic);
   }
 }
}
export class AssetKit {
 constructor(){this.items=new Map();this.footprints=new Map();}
 async load(){
  const landmarks=fetch(new URL('../../assets/scenery15.glb.gz?v=15.0.0',import.meta.url).href)
    .then(response=>{if(!response.ok)throw new Error('Ambienti di precisione non disponibili');return response.arrayBuffer();})
    .then(parseCompressedKit).catch(()=>null);
  const gantry = new GLTFLoader().loadAsync(new URL('../../assets/mobile-gantry.glb',import.meta.url).href).catch(() => null);
  const trees = new GLTFLoader().loadAsync(new URL('../../assets/botanical.glb',import.meta.url).href).catch(() => null);
  const diorama=fetch(new URL('../../assets/diorama.glb.gz',import.meta.url).href)
    .then(response=>{if(!response.ok)throw new Error('Scenografia non disponibile');return response.arrayBuffer();})
    .then(parseCompressedKit).catch(()=>null);
  const precision=fetch(new URL('../../assets/parts.glb.gz',import.meta.url).href)
    .then(response=>{if(!response.ok)throw new Error('Ricambi 3D non disponibili');return response.arrayBuffer();})
    .then(parseCompressedKit).catch(()=>null);
  const response=await fetch(new URL('../../assets/worldkit.glb.gz?v=6.0.0',import.meta.url).href);if(!response.ok)throw new Error('Kit 3D non disponibile: '+response.status);this.ingest(await parseCompressedKit(await response.arrayBuffer()));
  const extra = await gantry;
  if (extra) this.ingest(extra);
  const botanical = await trees;
  if (botanical) this.ingest(botanical);
  const parts=await precision;
  if(parts)this.ingest(parts);
  const scenery=await diorama;
  if(scenery)this.ingest(scenery);
  const newScenery=await landmarks;
  if(newScenery)this.ingest(newScenery);
  return this;
 }
 ingest(gltf){this.source=gltf.scene;
  for(const root of [...gltf.scene.children]){if(!/^(PROP_|PART_|ANIM_)/.test(root.name))continue;if(root.name.startsWith('PART_wheels_'))finishTyres(root);finishAssembly(root);root.removeFromParent();root.position.set(0,0,0);root.scale.setScalar(1);root.updateMatrixWorld(true);this.items.set(root.name,root);const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());this.footprints.set(root.name,Math.hypot(size.x,size.z)/2);}return this;
 }
 footprint(name){return this.footprints.get(name)??.7;}
 clone(name){const template=this.items.get(name);if(!template)return new THREE.Group();const root=template.clone(true);root.traverse(o=>{if(o.isMesh){o.userData.sharedAssets=true;o.castShadow=true;o.receiveShadow=true;}});return root;}
 instance(name,placements,parent){const template=this.items.get(name);if(!template||!placements.length)return;template.updateMatrixWorld(true);const object=new THREE.Object3D(),matrix=new THREE.Matrix4();
  template.traverse(part=>{if(!part.isMesh)return;const inst=new THREE.InstancedMesh(part.geometry,part.material,placements.length);inst.userData.sharedAssets=true;inst.castShadow=true;inst.receiveShadow=true;
   placements.forEach((p,i)=>{object.position.set(p.x,p.z??0,p.y);object.rotation.set(0,p.angle??0,0);const scale=p.scale??1;object.scale.setScalar(scale);object.updateMatrix();matrix.multiplyMatrices(object.matrix,part.matrixWorld);inst.setMatrixAt(i,matrix);});inst.computeBoundingSphere();parent.add(inst);
  });
 }
 destroy(){const gs=new Set(),ms=new Set();for(const root of this.items.values())root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());const maps=new Set([...ms].flatMap(m=>Object.values(m).filter(value=>value?.isTexture)));ms.forEach(m=>m.dispose());maps.forEach(t=>t.dispose());this.items.clear();}
}

export async function parseCompressedKit(bytes){if(typeof DecompressionStream==='undefined')throw new Error('Questo browser non supporta il kit 3D compresso');const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return new GLTFLoader().parseAsync(decoded,'');}
