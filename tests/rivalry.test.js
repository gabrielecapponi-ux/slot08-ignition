import test from 'node:test';
import assert from 'node:assert/strict';
import { RaceSession } from '../src/game/session.js';
import { PhysicsEngine, safeSpeed } from '../src/physics/engine.js';
import { bodyPose } from '../src/physics/grip.js';
import { createCar } from '../src/physics/car.js';
import { createTrack } from '../src/track/catalog.js';
import { carSetup } from '../src/game/setup.js';
import { AIDriver } from '../src/ai/driver.js';
import { RACE } from '../src/core/config.js';
const dt=1/120;

for(const level of [0,1,2]) for(const difficulty of ['club','pro']) {
  test(`held throttle fails on track ${level}/${difficulty}, including fully upgraded magnets`,()=>{
    for(const upgrades of [{},{grip:3}]){
      const s=new RaceSession();s.configure({level,difficulty,assisted:false,upgrades});s.status='running';
      for(let i=0;i<120*18&&!s.player.crashes;i++)s.update(dt,{throttle:1});
      assert.ok(s.player.crashes>0,'Holding throttle must reach the physical limit');
      assert.equal(s.player.laps,0,'First lap must already require braking');
    }
  });
}

test('a developing powerslide can be saved by lifting; holding power derails',()=>{
  const track=createTrack(0),engine=new PhysicsEngine(track),setup=carSetup('club');
  const make=()=>{const c=createCar({start:track.straightLength+1,setup});c.pose=track.pose(c.distance,c.lane);c.speed=safeSpeed(c.pose.curvature,c.maxGrip,c.pose.bank)*1.1;c.throttle=1;return c;};
  const held=make(),saved=make();
  for(let i=0;i<60;i++){engine.step(held,1,dt);engine.step(saved,1,dt);}
  assert.ok(saved.skid>.18);assert.ok(saved.instability>0);assert.equal(saved.state,'slotted');
  for(let i=0;i<180;i++){engine.step(held,1,dt);engine.step(saved,0,dt);}
  assert.equal(held.state,'derailed');assert.equal(saved.state,'slotted');assert.equal(saved.instability,0);assert.ok(saved.skid<.05);
});

test('model pivots around the front guide, with opposite rear swing in left and right curves',()=>{
  const pose={x:3,y:2,z:.4,angle:0,tx:1,ty:0};
  for(const angle of [-.5,.5]){const b=bodyPose(pose,angle);assert.ok(Math.abs(b.x+.105*Math.cos(angle)-(pose.x+.105))<1e-12);assert.ok(Math.abs(b.y+.105*Math.sin(angle)-pose.y)<1e-12);assert.equal(Math.sign(b.y-pose.y),-Math.sign(angle));}
});

test('human and bot receive identical forces, slides, derailments and 3 second recovery',()=>{
  const track=createTrack(0),engine=new PhysicsEngine(track),setup=carSetup('pro',{motor:2,grip:1,brake:2});
  const human=createCar({setup}),bot=createCar({setup,ai:true});let crashTime=null,recoveryTime=null;
  for(let i=0;i<120*12;i++){
    const a=engine.step(human,1,dt),b=engine.step(bot,1,dt);
    assert.equal(a,b);assert.equal(human.state,bot.state);assert.equal(human.distance,bot.distance);assert.equal(human.driftAngle,bot.driftAngle);assert.equal(human.instability,bot.instability);assert.equal(human.recoverIn,bot.recoverIn);
    if(a==='derail'&&crashTime===null)crashTime=i;
    if(a==='respawn'&&recoveryTime===null)recoveryTime=i;
  }
  assert.ok(crashTime!==null);assert.equal((recoveryTime-crashTime)*dt,3);
});

test('the entire grid uses the same upgraded hardware, with no handicap hidden in AI setup',()=>{
  const s=new RaceSession();s.configure({difficulty:'pro',upgrades:{motor:3,grip:2,brake:1}});
  for(const c of s.cars)assert.deepEqual(c.setup,s.player.setup);
});

test('seeded rivals slide with bounded errors under the same forgiving physics',()=>{
  let totalCrashes=0,skidSeconds=0;
  for(const seed of [1,2,3,4]){const s=new RaceSession({seed});s.configure({difficulty:'club',assisted:true});s.status='running';for(let i=0;i<120*70&&s.status!=='finished';i++)s.update(dt,{throttle:1});for(const c of s.cars.slice(1)){totalCrashes+=c.crashes;skidSeconds+=c.skidSeconds;assert.ok(c.laps>=2);}}
  assert.ok(totalCrashes>=0);assert.ok(totalCrashes<16);assert.ok(skidSeconds>5);
});

test('rival decisions are reproducible and cannot read player ranking when no traffic is supplied',()=>{
  const track=createTrack(0),engine=new PhysicsEngine(track),a=createCar(),b=createCar();
  const one=new AIDriver(track,.98,{reaction:.14,errorRate:.2,seed:98}),two=new AIDriver(track,.98,{reaction:.14,errorRate:.2,seed:98});
  for(let i=0;i<2400;i++){a.pose=track.pose(a.distance,a.lane);b.pose=track.pose(b.distance,b.lane);const x=one.input(a,dt),y=two.input(b,dt);assert.deepEqual(x,y);engine.step(a,x.throttle,dt);engine.step(b,y.throttle,dt);}
  assert.equal(a.distance,b.distance);assert.equal(a.crashes,b.crashes);
});

test('clean manual driving beats held throttle; safe assistance is no automatic first place',()=>{
  const run=(style,seed=808)=>{const s=new RaceSession({seed});s.configure({difficulty:'club',assisted:style==='assist'});s.status='running';const driver=new AIDriver(s.track,.98);for(let i=0;i<120*130&&s.status!=='finished';i++)s.update(dt,style==='clean'?driver.input(s.player,dt):{throttle:1});return s;};
  const held=run('held'),clean=run('clean'),assist=run('assist');
  assert.equal(held.status,'finished');assert.ok(held.player.crashes>=6);assert.equal(held.standings().findIndex(c=>!c.ai),5);
  assert.equal(clean.player.crashes-(clean.player.contactCrashes||0),0);assert.ok(clean.elapsed<held.elapsed*.75);assert.ok(clean.elapsed<assist.elapsed);
  // Contact between two rivals can hand even an assisted driver the win.
  assert.ok([assist,run('assist',1),run('assist',2)].some(race=>race.standings().indexOf(race.player)>0));
});

test('finish event observes every car crossing in the same tick before calculating ranks',()=>{
  let rank;const s=new RaceSession({onEvent:e=>{if(e.type==='finish')rank=s.standings().findIndex(c=>!c.ai)+1;}});
  s.configure({assisted:false});s.status='running';s.elapsed=40;
  const finish=RACE.startDistance+3*s.track.length;
  for(const c of s.cars){c.laps=2;c.distance=finish-(c.ai?.002:.010);c.speed=2;c.pose=s.track.pose(c.distance,c.lane);}
  s.update(dt,{throttle:1});assert.equal(s.status,'finished');assert.equal(rank,6);
});

test('records use a new physics version without erasing existing progression',()=>{
  const s=new RaceSession();assert.ok(s.recordKey.startsWith('club14:'));assert.equal(s.assisted,false);assert.equal(s.difficulty,'club');
});
