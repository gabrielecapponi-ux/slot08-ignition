import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
/** Shared Blender meshes. Consumers own instances, never the underlying buffers. */
export class AssetKit {
 constructor(){this.items=new Map();this.footprints=new Map();}
 async load(){const response=await fetch(new URL('../../assets/worldkit.glb.gz?v=6.0.0',import.meta.url).href);if(!response.ok)throw new Error('Kit 3D non disponibile: '+response.status);return this.ingest(await parseCompressedKit(await response.arrayBuffer()));
 }
 ingest(gltf){this.source=gltf.scene;
  for(const root of [...gltf.scene.children]){if(!/^(PROP_|PART_|ANIM_)/.test(root.name))continue;root.removeFromParent();root.position.set(0,0,0);root.scale.setScalar(1);root.updateMatrixWorld(true);this.items.set(root.name,root);const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());this.footprints.set(root.name,Math.hypot(size.x,size.z)/2);}return this;
 }
 footprint(name){return this.footprints.get(name)??.7;}
 clone(name){const template=this.items.get(name);if(!template)return new THREE.Group();const root=template.clone(true);root.traverse(o=>{if(o.isMesh){o.userData.sharedAssets=true;o.castShadow=true;o.receiveShadow=true;}});return root;}
 instance(name,placements,parent){const template=this.items.get(name);if(!template||!placements.length)return;template.updateMatrixWorld(true);const object=new THREE.Object3D(),matrix=new THREE.Matrix4();
  template.traverse(part=>{if(!part.isMesh)return;const inst=new THREE.InstancedMesh(part.geometry,part.material,placements.length);inst.userData.sharedAssets=true;inst.castShadow=true;inst.receiveShadow=true;
   placements.forEach((p,i)=>{object.position.set(p.x,p.z??0,p.y);object.rotation.set(0,p.angle??0,0);const scale=p.scale??1;object.scale.setScalar(scale);object.updateMatrix();matrix.multiplyMatrices(object.matrix,part.matrixWorld);inst.setMatrixAt(i,matrix);});inst.computeBoundingSphere();parent.add(inst);
  });
 }
 destroy(){const gs=new Set(),ms=new Set();for(const root of this.items.values())root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());this.items.clear();}
}

export async function parseCompressedKit(bytes){if(typeof DecompressionStream==='undefined')throw new Error('Questo browser non supporta il kit 3D compresso');const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return new GLTFLoader().parseAsync(decoded,'');}
