import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSize,QualityGovernor} from '../src/render/quality.js';
import {FixedLoop} from '../src/core/loop.js';
import {racePose,angleMix} from '../src/render/race-pose.js';

test('4K is an actual bounded drawing buffer and adaptive mobile respects pixel budgets',()=>{
 assert.deepEqual(renderSize({width:1920,height:1080,profile:'ultra'}),{width:3840,height:2160,ratio:2});
 const portrait=renderSize({width:390,height:844,profile:'ultra',maxSize:4096});assert.equal(portrait.height,3840);assert.ok(portrait.width*portrait.height<=8294400);
 for(const w of [320,390,844,1920,3840])for(const h of [390,844,1080,2160]){const q=renderSize({width:w,height:h,dpr:3,mobile:true});assert.ok(q.width*q.height<=3200000);assert.ok(Math.max(q.width,q.height)<=8192);}
 const gpu=renderSize({width:1920,height:1080,profile:'ultra',maxSize:2048});assert.equal(gpu.width,2048);
});
test('adaptive quality detects 60 Hz pacing without endlessly degrading and responds to load',()=>{
 const q=new QualityGovernor();for(let i=0;i<720;i++)q.sample(1/60,2);assert.equal(q.scale,1);assert.equal(q.observedHz,60);
 for(let i=0;i<360;i++)q.sample(1/120,2);assert.equal(q.observedHz,120);
 for(let i=0;i<500;i++)q.sample(1/35,25);assert.ok(q.scale<1&&q.scale>=.55);
 const u=new QualityGovernor('ultra');for(let i=0;i<400;i++)u.sample(1/25,30);assert.equal(u.scale,1);
});
test('render rate scheduling does not change fixed 120 Hz simulation speed',()=>{
 globalThis.requestAnimationFrame=()=>1;
 for(const screen of [60,120,144])for(const render of [60,120]){
  let ticks=0,frames=0;const l=new FixedLoop(()=>ticks++,()=>frames++);l.setRenderRate(render);
  for(let i=0;i<=screen*3;i++)l.frame(i*1000/screen);
  assert.ok(Math.abs(ticks-360)<=1);assert.ok(Math.abs(frames-(Math.min(screen,render)*3+1))<=2,`${screen}/${render}: ${frames}`);
 }
 delete globalThis.requestAnimationFrame;
});
test('render interpolation removes angular wrap jumps and snaps respawns',()=>{
 assert.ok(Math.abs(angleMix(Math.PI-.01,-Math.PI+.01,.5)-Math.PI)<1e-8);
 const car={state:'slotted',previousState:'slotted',driftAngle:0,previousDrift:0,previousPose:{x:0,y:0,z:0,angle:Math.PI-.01,bank:.1,pitch:0},pose:{x:.1,y:0,z:.1,angle:-Math.PI+.01,bank:.2,pitch:.1}};
 const p=racePose(car,.5);assert.ok(Math.abs(p.x-.05)<1e-8);assert.equal(p.z,.05);assert.ok(Math.abs(p.bank-.15)<1e-8);
 car.previousState='derailed';assert.equal(racePose(car,.1).x,.1);
});
