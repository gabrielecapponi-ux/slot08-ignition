import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
const {AssetKit,parseCompressedKit}=await import('../src/render/asset-kit.js');
const {MiniatureWorld}=await import('../src/render/world.js');
const {buildModularTrack}=await import('../src/render/modular-track.js');
const {createTrack}=await import('../src/track/catalog.js');
const {PARTS}=await import('../src/game/workshop.js');
const {addCarStyle}=await import('../src/render/car-style.js');
const canvas=()=>({width:0,height:0,getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})})});
globalThis.document={createElement:()=>canvas()};globalThis.window={matchMedia:()=>({matches:false})};
const bytes=readFileSync(new URL('../assets/worldkit.glb.gz',import.meta.url));
const kit=new AssetKit().ingest(await parseCompressedKit(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)));

test('every Blender part loads at car scale and remains finite in all 60 garage previews',()=>{
 for(const [key,part]of Object.entries(PARTS))for(let value=1;value<part.names.length;value++){
  const name=`PART_${key}_${value}`;assert.ok(kit.items.has(name),name);
  const size=new THREE.Box3().setFromObject(kit.clone(name)).getSize(new THREE.Vector3());assert.ok(size.length()>.01&&size.length()<.55,`${name} scale: ${size.toArray()}`);
  const root=new THREE.Group();addCarStyle(root,{appearance:{[key]:value}},kit);assert.ok(root.children.length);root.updateMatrixWorld(true);
  root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));});
 }
});

test('all fifteen world scenes and road meshes construct with finite vertices and instance transforms',()=>{
 for(let level=0;level<15;level++){
  const t=createTrack(level),world=new MiniatureWorld(t,kit),road=buildModularTrack(t);world.update(.016,'drone',true);world.update(.016,'top',true);
  for(const group of [world.root,road]){group.updateMatrixWorld(true);group.traverse(o=>{
   assert.ok(o.matrixWorld.elements.every(Number.isFinite));
   if(o.geometry){const a=o.geometry.attributes.position;assert.ok(a.count>0);assert.ok(a.array.every(Number.isFinite),`${level}/${o.type}`);}
   if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));
  });}
  assert.ok(world.animated.length>0);assert.equal(world.roofMat.opacity,.24);
 }
});
