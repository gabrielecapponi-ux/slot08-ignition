import test from 'node:test';
import assert from 'node:assert/strict';
import { FigureEight } from '../src/track/figure-eight.js';
import { PhysicsEngine, lateralDemand, safeSpeed } from '../src/physics/engine.js';
import { createCar } from '../src/physics/car.js';
import { PHYSICS, RACE } from '../src/core/config.js';
import { RaceSession } from '../src/game/session.js';
import { AIDriver } from '../src/ai/driver.js';
import { RecordStore } from '../src/game/storage.js';
const dt=PHYSICS.fixedStep;

test('track closes, tangent joins are continuous, left and right corners have opposite curvature',()=>{
  const t=new FigureEight();for(const s of [0,t.straightLength,t.halfLength,2*t.straightLength+t.arcLength]){
    const a=t.sample(s-1e-6),b=t.sample(s+1e-6);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<3e-6);assert.ok(a.tx*b.tx+a.ty*b.ty>.999999);
  }
  assert.ok(t.sample(t.straightLength+1).curvature>0);assert.ok(t.sample(t.length-1).curvature<0);
});
test('the intersection has two physically distinct elevations',()=>{
  const t=new FigureEight(),a=t.sample(t.straightLength/2),b=t.sample(t.halfLength+t.straightLength/2);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);assert.ok(a.z-b.z>.26);
});
test('inner lane has higher centripetal demand and shorter physical distance',()=>{
  const t=new FigureEight(),s=t.straightLength+1,a=t.pose(s,0),b=t.pose(s,1);
  assert.ok(Math.abs(b.curvature)>Math.abs(a.curvature));assert.ok(b.metric<a.metric);assert.ok(safeSpeed(b.curvature)<safeSpeed(a.curvature));
});
test('centripetal force doubles with mass and quadruples with speed',()=>{
  assert.equal(lateralDemand(2,.5),4*lateralDemand(1,.5));assert.equal(lateralDemand(1,.5,.17),2*lateralDemand(1,.5));
});
test('full throttle accelerates and release brakes without reverse motion',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar();for(let i=0;i<60;i++)e.step(c,1,dt);
  assert.ok(c.speed>1);const v=c.speed;for(let i=0;i<20;i++)e.step(c,0,dt);assert.ok(c.speed<v);
  for(let i=0;i<300;i++)e.step(c,0,dt);assert.equal(c.speed,0);assert.equal(c.state,'slotted');
});
test('below threshold stays slotted; gross overload leaves tangent to its lane',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),s=t.straightLength+1;
  const slow=createCar({start:s}),fast=createCar({start:s});const p=t.pose(s,0);
  slow.speed=safeSpeed(p.curvature)*.97;fast.speed=safeSpeed(p.curvature)*2.5;
  e.step(slow,0,dt);assert.equal(slow.state,'slotted');assert.equal(e.step(fast,0,dt),'derail');
  const expected=t.pose(fast.distance,fast.lane);assert.ok(Math.abs(fast.crash.vx*expected.ty-fast.crash.vy*expected.tx)<1e-9);
});
test('keeping throttle on reaches a corner too fast and derails',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar();for(let i=0;i<1200&&c.state==='slotted';i++)e.step(c,1,dt);
  assert.equal(c.state,'derailed');assert.equal(c.crashes,1);
});
test('crash drifts off track, freezes progress and respawns at the same position after exactly 3 s',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar({start:t.straightLength+1});c.speed=4;for(let i=0;i<120&&c.state==='slotted';i++)e.step(c,1,dt);
  const distance=c.distance,x=c.crash.x;for(let i=0;i<359;i++)e.step(c,1,dt);
  assert.equal(c.state,'derailed');assert.equal(c.distance,distance);assert.notEqual(c.crash.x,x);assert.equal(e.step(c,1,dt),'respawn');assert.equal(c.distance,distance);assert.equal(c.speed,0);
});
test('lane changes are rejected outside X and smoothly complete inside X',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar();assert.equal(e.changeLane(c),false);
  c.distance=t.switches[0].start+.05;c.speed=1.1;assert.equal(e.changeLane(c),true);assert.equal(e.changeLane(c),false);
  for(let i=0;i<500&&c.change;i++)e.step(c,.55,dt);
  assert.equal(c.state,'slotted');assert.equal(c.lane,1);assert.equal(c.change,null);
});
test('switches remain available on later laps',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar({start:3*t.length+t.switches[1].start+.1});assert.equal(e.changeLane(c),true);
});
test('pause freezes race, recovery timer and countdown',()=>{
  const s=new RaceSession();s.start();s.update(.5,{throttle:0});s.pause();const countdown=s.countdown;s.update(1,{throttle:1});assert.equal(s.countdown,countdown);
  s.resume();for(let i=0;i<400;i++)s.update(dt,{throttle:0});s.player.speed=4;s.player.distance=s.track.straightLength+1;s.update(dt,{throttle:0});
  s.pause();const time=s.elapsed,remaining=s.player.recoverIn;s.update(5,{throttle:1});assert.equal(s.elapsed,time);assert.equal(s.player.recoverIn,remaining);
});
test('a 3 s recovery consumes time once, without adding a second penalty',()=>{
  const s=new RaceSession();s.status='running';s.player.distance=s.track.straightLength+1;s.player.speed=4;for(let i=0;i<120&&s.player.state!=='derailed';i++)s.update(dt,{throttle:1});assert.equal(s.player.state,'derailed');const start=s.elapsed;
  for(let i=0;i<360;i++)s.update(dt,{throttle:0});assert.ok(Math.abs(s.elapsed-start-3)<1e-9);assert.equal(s.player.state,'slotted');
});
test('AI completes laps through the same physics without derailing',()=>{
  const t=new FigureEight(),e=new PhysicsEngine(t),c=createCar(),ai=new AIDriver(t,.86);
  for(let i=0;i<120*45;i++)e.step(c,ai.input(c).throttle,dt);
  assert.ok(c.distance>t.length*3);assert.equal(c.crashes,0);
});
test('time attack counts actual finish-line crossings and records complete laps',()=>{
  const s=new RaceSession();s.status='running';const ai=new AIDriver(s.track,.86);
  for(let i=0;i<120*30;i++)s.update(dt,ai.input(s.player));
  assert.ok(s.player.laps>=2);assert.equal(s.player.lapTimes.length,s.player.laps);assert.ok(s.player.bestLap>5);assert.ok(s.player.bestLap<15);
});
test('race finishes after 3 complete player laps, resets and creates two opponents',()=>{
  const s=new RaceSession();s.reset('race');assert.equal(s.cars.length,3);s.status='running';const ai=new AIDriver(s.track,.9);
  for(let i=0;i<120*60&&s.status==='running';i++)s.update(dt,ai.input(s.player));
  assert.equal(s.status,'finished');assert.equal(s.player.laps,RACE.laps);assert.ok(s.player.finishedAt>0);
  s.reset();assert.equal(s.elapsed,0);assert.equal(s.player.laps,0);assert.equal(s.player.crashes,0);
});
test('host frame rate does not alter fixed-step outcome',()=>{
  const run=fps=>{const s=new RaceSession();s.status='running';let acc=0;for(let frame=0;frame<fps*10;frame++){acc+=1/fps;while(acc>=dt-1e-10){s.update(dt,{throttle:1});acc-=dt;}}return s;};
  const a=run(30),b=run(144);assert.ok(Math.abs(a.player.distance-b.player.distance)<1e-8);assert.equal(a.player.crashes,b.player.crashes);assert.ok(Math.abs(a.elapsed-b.elapsed)<1e-8);
});
test('records resist corrupt or blocked storage and keep only finite improvements',()=>{
  const store=new RecordStore({getItem:()=>'{garbage',setItem:()=>{throw Error('blocked');}});assert.equal(store.get('time'),Infinity);assert.equal(store.save('time',9.4),true);assert.equal(store.save('time',11),false);assert.equal(store.save('time',NaN),false);assert.equal(store.get('time'),9.4);
});
