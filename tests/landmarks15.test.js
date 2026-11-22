import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {AssetKit,parseCompressedKit}=await import('../src/render/asset-kit.js');
const {landmarkPlacements,levelLandmarkFoundations}=await import('../src/render/landmarks.js');
const {createTrack}=await import('../src/track/catalog.js');
const {createLandscape}=await import('../src/track/landscape.js');
const {MEETINGS}=await import('../src/game/tour.js');

// Decode image containers without a DOM. Rendering is verified separately in Blender.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:256,height:256,close(){}});

test('Blender scenery is opaque, grounded and placed clear of every branch',async()=>{
 const kit=new AssetKit().ingest(await parseCompressedKit(await readFile(new URL('../assets/scenery15.glb.gz',import.meta.url))));
 assert.equal(kit.items.size,4);
 const used=new Set();let triangles=0;
 for(const model of kit.items.values()){
  const bounds=new THREE.Box3().setFromObject(model);
  assert.ok(Math.abs(bounds.min.y)<.025,'asset base is at ground level');
  assert.ok(bounds.max.y<4.7,'landmark stays within its scale budget');
  model.traverse(o=>{if(!o.isMesh)return;assert.equal(o.material.transparent,false);assert.equal(o.material.depthWrite,true);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
 }
 assert.ok(triangles<140000,'scenery stays within its triangle budget');
 for(const [variant,m]of MEETINGS.entries()){
  const track=createTrack(m.level,{lanes:4,variant}),field=createLandscape(track),placed=landmarkPlacements(track,field,kit);
  if(['night','forest','alpine','harbor'].includes(track.theme))assert.ok(placed.length>0,`landmarks absent from ${variant}`);
  for(const [i,p]of placed.entries()){
   used.add(p.key);
   assert.ok(field.distance(p.x,p.y)>=p.size+.64+(track.extraWidth||0));
   for(const q of placed.slice(i+1))assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=p.size+q.size+.25);
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.size*2.5,p.size*2.5,10,10));mesh.geometry.rotateX(-Math.PI/2);mesh.geometry.translate(p.x,1.1,p.y);
   levelLandmarkFoundations(mesh,[p]);const pos=mesh.geometry.attributes.position;
   for(let j=0;j<pos.count;j++)if(Math.hypot(pos.getX(j)-p.x,pos.getZ(j)-p.y)<p.size*.90)assert.ok(Math.abs(pos.getY(j)-(p.foundationZ-.002))<1e-6);
   mesh.geometry.dispose();mesh.material.dispose();
  }
 }
 assert.equal(used.size,4);kit.destroy();
});
