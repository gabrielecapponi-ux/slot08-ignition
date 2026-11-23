import test from 'node:test';
import assert from 'node:assert/strict';
import {championshipBase} from '../src/track/arcade-layouts.js';

test('each world has two stages with 180 degree hairpins traversed uphill then downhill',()=>{
 const counts=Array(10).fill(0);
 for(let id=0;id<100;id++){
   const base=championshipBase(id);
   if(!base.hairpins)continue;
   counts[Math.floor(id%50/5)]++;
   for(const {start,end,climb} of base.hairpins){
     let angle=0;for(let s=start;s<end;s+=.02)angle+=base.sample(s+.01).curvature*.02;
     assert.ok(Math.abs(Math.abs(angle)-Math.PI)<.05);
     assert.ok((base.sample(end).z-base.sample(start).z)*(climb?1:-1)>.55);
   }
 }
 assert.deepEqual(counts,Array(10).fill(2));
});
