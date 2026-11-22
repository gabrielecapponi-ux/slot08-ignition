import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {createTrack} from '../src/track/catalog.js';
import {MEETINGS} from '../src/game/tour.js';
register('../scripts/three-test-loader.mjs',import.meta.url);
const {buildModularTrack}=await import('../src/render/modular-track.js');
const context={fillRect(){},fillText(){},createLinearGradient(){return {addColorStop(){}};}};
globalThis.document={createElement:()=>({getContext:()=>context})};
test('all campaign meshes are finite and split decks do not span the median',()=>{
 for(const [id,m] of MEETINGS.entries()){
  const t=createTrack(m.level,{lanes:4,variant:id}),root=buildModularTrack(t);
  root.traverse(o=>{const p=o.geometry?.attributes.position;if(p)for(const v of p.array)assert.ok(Number.isFinite(v),'course '+id);});
  const decks=root.children.filter(o=>o.material?.clearcoat===1);assert.equal(decks.length,t.fork?2:1);assert.ok(decks.every(o=>o.material.roughness<.5));
  if(t.fork){assert.ok(root.getObjectByName('Barriera interna bivio'));const i=Math.round((t.fork.start+t.fork.end)/2/t.length*(decks[0].geometry.attributes.position.count/2-1));const left=decks[0].geometry.attributes.position,right=decks[1].geometry.attributes.position;assert.ok(Math.hypot(left.getX(i*2+1)-right.getX(i*2),left.getZ(i*2+1)-right.getZ(i*2))>1.4);}
  const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});
 }
});
