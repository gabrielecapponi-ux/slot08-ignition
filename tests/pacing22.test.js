import test from 'node:test';
import assert from 'node:assert/strict';
import {FixedLoop} from '../src/core/loop.js';
import {carbonTow,barrierPixel} from '../src/render/material-grain.js';

test('60 Hz display jitter does not drop alternate frames or speed up physics',()=>{
 const original=globalThis.requestAnimationFrame;
 globalThis.requestAnimationFrame=()=>1;
 try{
   let frames=0,steps=0;
   const loop=new FixedLoop(()=>steps++,()=>frames++);loop.setRenderRate(60);
   for(let i=0;i<=120;i++)loop.frame(i*1000/60+(i%2?.30:0));
   assert.equal(frames,121);assert.ok(Math.abs(steps-240)<=1);
 }finally{globalThis.requestAnimationFrame=original;}
});
test('woven carbon and metallic borders tile without discontinuities',()=>{
 for(const [x,y] of [[0,0],[7,11],[205,230]]){
  assert.ok(Math.abs(carbonTow(x,y)-carbonTow(x+256,y+256))<1e-9);
 }
 assert.ok(barrierPixel(100,5).every(channel=>channel>100));
});
