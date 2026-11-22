import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createTrack} from '../src/track/catalog.js';
import {MEETINGS} from '../src/game/tour.js';
import {createLandscape} from '../src/track/landscape.js';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {buildSafetyRail,trackPoint}=await import('../src/render/safety-rail.js');
function dispose(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>{m.map?.dispose();m.dispose();});}

test('opaque closed safety rails and anchored posts cover all 50 campaign tracks',()=>{
 for(const [id,m]of MEETINGS.entries()){
  const track=createTrack(m.level,{lanes:4,variant:id}),rails=buildSafetyRail(track);
  assert.equal(rails.children.filter(o=>o.name==='Guardrail Aegis 08').length,2);
  rails.traverse(o=>{if(o.material){assert.equal(o.material.transparent,false);assert.equal(o.material.depthWrite,true);}const p=o.geometry?.attributes.position;if(p)for(const v of p.array)assert.ok(Number.isFinite(v),`track ${id}`);});
  assert.ok(rails.userData.postPlacements.length>track.length*2);
  for(const p of rails.userData.postPlacements){assert.ok(Math.abs(p.top[1]-p.foot[1]-.202)<1e-8);assert.equal(p.top[0],p.foot[0]);assert.equal(p.top[2],p.foot[2]);}
  if(track.fork){
   const f=track.fork,at=(f.start+f.end)/2,p=track.sample(at);
   const left=trackPoint(p,.018-.034,.20,1),right=trackPoint(p,-.018+.034,.20,-1);
   assert.ok(left.distanceTo(right)>1.4,'inner backface stays on its own branch');
   const field=createLandscape(track);
   for(const side of[-1,1]){const x=p.x+p.nx*side*f.gap/2,y=p.y+p.ny*side*f.gap/2;assert.ok(field.distance(x,y)<.17,'fork footprint is reserved');}
  }
  dispose(rails);
 }
});

test('road-facing guardrail surfaces have outward normals, visible from inside',()=>{
 const track=createTrack(0,{lanes:4,variant:0}),rails=buildSafetyRail(track),p=track.sample(2);
 rails.updateMatrixWorld(true);
 for(const side of[-1,1]){
  const origin=trackPoint(p,side*.2,.17),direction=new THREE.Vector3(p.nx*side,0,p.ny*side);
  const ray=new THREE.Raycaster(origin,direction,0,1),hit=ray.intersectObjects(rails.children,false).find(h=>h.object.name==='Guardrail Aegis 08');
  assert.ok(hit,'opaque rail must face the race lane');
 }
 dispose(rails);
});
