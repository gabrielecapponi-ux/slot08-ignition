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

const originalBitmap=globalThis.createImageBitmap;
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:192,height:192,close(){}});
const precisionBytes=readFileSync(new URL('../assets/parts.glb.gz',import.meta.url));
const precision=await parseCompressedKit(precisionBytes.buffer.slice(precisionBytes.byteOffset,precisionBytes.byteOffset+precisionBytes.byteLength));
kit.ingest(precision);
if(originalBitmap)globalThis.createImageBitmap=originalBitmap;
else delete globalThis.createImageBitmap;

test('every Blender part loads at car scale and remains finite in all 60 garage previews',()=>{
 for(const [key,part]of Object.entries(PARTS))for(let value=1;value<part.names.length;value++){
  const name=`PART_${key}_${value}`;assert.ok(kit.items.has(name),name);
  const size=new THREE.Box3().setFromObject(kit.clone(name)).getSize(new THREE.Vector3());assert.ok(size.length()>.01&&size.length()<.55,`${name} scale: ${size.toArray()}`);
  const root=new THREE.Group();addCarStyle(root,{appearance:{[key]:value}},kit);assert.ok(root.children.length);root.updateMatrixWorld(true);
  root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));});
 }
});

test('all fifteen two- and four-lane world scenes and road meshes construct with finite vertices and instance transforms',()=>{
 for(const lanes of [2,4])for(let level=0;level<15;level++){
  const t=createTrack(level,{lanes}),world=new MiniatureWorld(t,kit),road=buildModularTrack(t);world.update(.016,'drone',true);world.update(.016,'top',true);
  for(const group of [world.root,road]){group.updateMatrixWorld(true);group.traverse(o=>{
   assert.ok(o.matrixWorld.elements.every(Number.isFinite));
   if(o.geometry){const a=o.geometry.attributes.position;assert.ok(a.count>0);assert.ok(a.array.every(Number.isFinite),`${level}/${o.type}`);}
   if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));
  });}
  assert.ok(world.animated.length>0);assert.equal(world.roofMat.opacity,1);assert.equal(world.roofMat.transparent,false);assert.equal(world.roofs.visible,false);
  world.update(.016,'drone',true,false);assert.equal(world.roofs.visible,true);
  world.update(.016,'chase',true,true);assert.equal(world.roofs.visible,true);
 }
});

test('club pit furniture and timing signs build for all six championship rounds',async()=>{
 const {MEETINGS}=await import('../src/game/club.js');
 const {clubRoom}=await import('../src/render/club-room.js');
 for(const meeting of MEETINGS){
  const track=createTrack(meeting.level);track.meeting=meeting;
  const room=clubRoom(track);room.updateMatrixWorld(true);
  assert.ok(room.children.some(m=>m.userData.ownTexture && m.material.map));
  assert.ok(room.children.every(m=>m.matrixWorld.elements.every(Number.isFinite)));
 }
});
