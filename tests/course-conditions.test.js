import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack} from '../src/track/catalog.js';
import {surfaceGrip,upcomingSurface} from '../src/track/conditions.js';
import {collideBarriers,BARRIER} from '../src/physics/barriers.js';
import {RaceSession} from '../src/game/session.js';
import {carSetup} from '../src/game/setup.js';
import {safeSpeed} from '../src/physics/engine.js';
import {planSpeed} from '../src/ai/line-planner.js';
import {Profile} from '../src/game/profile.js';
import {PHYSICS} from '../src/core/config.js';

test('course hazards are visible, deterministic, avoid bridges and leave the other lane usable',()=>{
 let count=0;
 for(let level=0;level<15;level++){
  const track=createTrack(level);assert.deepEqual(track.conditions,createTrack(level).conditions);
  for(const zone of track.conditions){
   count++;const s=zone.start+zone.length/2;assert.ok(track.sample(zone.start).z<.17);
   const grip=surfaceGrip(track,s,zone.lane,carSetup('club'));
   assert.ok(grip<.85&&grip>.7);assert.equal(surfaceGrip(track,s,1-zone.lane,carSetup('club')),1);
   const warning=upcomingSurface(track,{distance:zone.start-3,speed:2,lane:zone.lane});
   assert.equal(warning.label,zone.label);assert.equal(warning.affected,true);assert.ok(warning.distance>=2.99);
   assert.ok(surfaceGrip(track,s,zone.lane,carSetup('rookie'))>grip);
  }
 }
 assert.ok(count>=8);
});
test('AI braking envelope sees the same slippery surface as the driver',()=>{
 const s=new RaceSession();s.configure({level:1,hazards:true});s.reset('time');const zone=s.track.conditions[0];assert.ok(zone);
 const c=s.player;c.lane=zone.lane;c.distance=zone.start+.6;c.pose=s.track.pose(c.distance,c.lane);c.speed=2;
 const slippery=planSpeed(s.track,c);const zones=s.track.conditions;s.track.conditions=[];
 const clean=planSpeed(s.track,c);s.track.conditions=zones;assert.ok(slippery<clean);
});
test('swept steel-rail collisions reflect velocity, dissipate energy and do not catch a different deck',()=>{
 for(const side of [-1,1])for(const z of [0,2]){
  const p={x:0,y:0,z,tx:1,ty:0,nx:0,ny:1,bank:0};
  const crash={x:.02,y:side*.39,z:z+.09,vx:1,vy:side*3,vz:0,spin:8,rollSpeed:5};
  assert.equal(collideBarriers(crash,{x:0,y:side*.30,z:z+.09},[p]),true);
  assert.ok(Math.abs(crash.y)<BARRIER.offset-BARRIER.carRadius);assert.ok(crash.vy*side<0);
  assert.ok(crash.vx**2+crash.vy**2<10);assert.equal(crash.wallHits,1);
  const under={x:.02,y:side*.39,z:.08,vx:1,vy:side*3,vz:0,spin:8,rollSpeed:5};
  assert.equal(collideBarriers(under,{x:0,y:side*.30,z:.08},[{...p,z:3}]),false);
 }
});
test('original difficulty is retained and motor upgrades still increase speed',()=>{
 const club=carSetup('club'),pro=carSetup('pro'),rookie=carSetup('rookie');
 assert.equal(club.gripForce,PHYSICS.gripForce);assert.equal(pro.gripForce,PHYSICS.gripForce*.92);
 assert.ok(pro.gripForce<club.gripForce);assert.ok(rookie.gripForce>PHYSICS.gripForce);
 assert.ok(carSetup('club',{motor:10}).maxSpeed>club.maxSpeed);
});
test('new surface conditions are opt-in and records remain distinct',()=>{
 const s=new RaceSession();s.configure({level:1});assert.equal(s.track.conditions.length,0);const key=s.recordKey;
 s.configure({hazards:true});assert.ok(s.track.conditions.length);assert.notEqual(s.recordKey,key);
 s.configure({hazards:false});assert.equal(s.track.conditions.length,0);assert.equal(s.recordKey,key);
});
test('finish presentation advances without changing timing or awarding rewards twice',()=>{
 const s=new RaceSession(),p=new Profile();s.status='finished';const elapsed=s.elapsed,position=s.player.distance;
 const reward=p.complete(s),credits=p.data.credits;
 for(let i=0;i<120;i++)s.update(1/120,{throttle:1});
 assert.ok(s.celebration>.99);assert.equal(s.elapsed,elapsed);assert.equal(s.player.distance,position);
 assert.equal(p.complete(s),null);assert.equal(p.data.credits,credits);assert.ok(Array.isArray(reward.unlockedCars));
});
