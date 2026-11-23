import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {register} from 'node:module';
import {surfaceGrip} from '../src/track/conditions.js';
import {RaceSession} from '../src/game/session.js';
import {Profile} from '../src/game/profile.js';
import {PARTS} from '../src/game/workshop.js';
register('../scripts/three-test-loader.mjs',import.meta.url);
const {AssetKit,parseCompressedKit}=await import('../src/render/asset-kit.js');
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
const {benchView}=await import('../src/render/part-bench.js');

test('rain, heat and local snow/sand affect tyre grip and records',()=>{
 const s=new RaceSession(),keys=new Set();
 for(const key of ['dry','rain','heat','sand','snow']){
   s.weatherChoice=key;s.reset();keys.add(s.recordKey);
   const t=s.track;
   assert.equal(surfaceGrip(t,0,0),key==='rain'?.78:key==='heat'?1.13:1);
   if(key==='rain'&&t.tunnels.length)assert.equal(surfaceGrip(t,t.tunnels[0].start+.01,0),1);
   if(['sand','snow'].includes(key)){
     assert.equal(t.conditions.length,2);
     for(const z of t.conditions){assert.ok(surfaceGrip(t,z.start+1,z.lane)<.8);assert.equal(surfaceGrip(t,z.start+1,(z.lane+1)%4),1);}
   }
 }
 assert.equal(keys.size,5);
});

test('real mounted and preview parts yield distinct nonempty images for all 60 variants and every mechanical system',async()=>{
 globalThis.self=globalThis;
 globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
 const kit=new AssetKit();kit.ingest(await parseCompressedKit(await readFile(new URL('../assets/parts.glb.gz',import.meta.url))));
 const bytes=await readFile(new URL('../assets/fleet-0.glb',import.meta.url));
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')).scene;
 const fleet={forChassis:()=>scene.getObjectByName('CAR_GT')};
 const w=200,h=82;let digest;
 const ctx={clearRect(){digest=null;},createImageData:()=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData(image){
   assert.ok(image.data.filter((v,i)=>i%4===3&&v>0).length>40);
   digest=createHash('sha256').update(image.data).digest('hex');
 }};
 const canvas={width:w,height:h,getContext:()=>ctx},p=new Profile();p.data.credits=99999;
 const image=(key,appearance=p.data.appearance,upgrades=p.data.upgrades)=>{
   benchView(canvas,{kit,fleet},{appearance,upgrades,chassis:0},key);assert.ok(digest,key);return digest;
 };
 for(const key of Object.keys(PARTS)){
   const images=new Set([image(key)]);
   for(let i=1;i<=10;i++){
     const preview=image(key,{...p.data.appearance,[key]:i});
     assert.ok(p.equip(key,i));assert.equal(image(key),preview);
     images.add(preview);
   }
   assert.equal(images.size,11,key);
 }
 for(const key of Object.keys(p.data.upgrades)){
   const before=image(key),after=image(key,p.data.appearance,{...p.data.upgrades,[key]:1});
   assert.notEqual(before,after,key);assert.ok(p.upgrade(key));assert.equal(image(key),after);
 }
});
