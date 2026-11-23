import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createTrack} from '../src/track/catalog.js';
import {RaceSession} from '../src/game/session.js';
import {createCar} from '../src/physics/car.js';
import {PhysicsEngine} from '../src/physics/engine.js';
import {bodyContact,resolveContacts} from '../src/physics/contacts.js';
import {carSetup} from '../src/game/setup.js';
import {afterEffectsScript} from '../src/motion/after-effects.js';

test('all four-lane circuits have finite separated slots and a connected adjacent crossover graph',()=>{
 for(let level=0;level<15;level++){
  const t=createTrack(level,{lanes:4});assert.equal(t.lanes.length,4);assert.ok(Math.abs(t.width-1.28)<1e-8);
  const seen=new Set([0]);for(let n=0;n<8;n++)for(const gate of t.switches)for(const lane of [...seen]){const to=t.switchTarget(gate,lane);assert.ok(Math.abs(to-lane)<=1);seen.add(to);}
  assert.equal(seen.size,4,'connected circuit '+level);
  for(let s=0;s<t.length;s+=.2)for(const lane of t.lanes){const p=t.pose(s,lane);assert.ok(Number.isFinite(p.x+p.y+p.z+p.metric+p.curvature));assert.ok(p.metric>.4);}
  for(const gate of t.switches)for(const lane of t.lanes){const car=createCar({lane});car.distance=gate.start+.01;const engine=new PhysicsEngine(t),ok=engine.changeLane(car);assert.equal(ok,t.switchTarget(gate,lane)!==lane);if(ok)assert.equal(car.change.to,t.switchTarget(gate,lane));}
 }
});
test('campaign and Grand Prix start four cars on four separate lanes; legacy modes remain available',()=>{
 const s=new RaceSession();for(const mode of ['campaign','grandprix']){s.reset(mode);assert.equal(s.cars.length,6);assert.equal(new Set(s.cars.map(c=>c.lane)).size,4);assert.equal(s.drivers.size,5);}
 s.reset('local3');assert.equal(s.players.length,3);assert.equal(s.track.laneCount,2);
});
function pair(separation=.26){const track=createTrack(0,{lanes:4}),a=createCar({setup:carSetup(),lane:1}),b=createCar({id:'b',setup:carSetup(),lane:1});a.distance=1;b.distance=1+separation;a.speed=3;b.speed=1.5;for(const c of [a,b])c.pose=track.pose(c.distance,c.lane);return {track,a,b,engine:new PhysicsEngine(track)};}
test('a bumper contact transfers momentum; open space never applies a hidden speed limit',()=>{
 const {track,a,b,engine}=pair();assert.ok(bodyContact(a,b));let contacts=0;resolveContacts(track,[a,b],engine,()=>contacts++);
 assert.ok(b.speed>1.5);assert.ok(a.speed<3);assert.equal(a.state,'slotted');assert.equal(b.state,'slotted');assert.equal(contacts,1);
 const free=pair(.5);const speed=free.a.speed;resolveContacts(free.track,[free.a,free.b],free.engine);assert.equal(free.a.speed,speed);assert.equal(free.b.speed,1.5);
 free.a.trafficLimit=0;free.engine.step(free.a,1,1/120);assert.ok(free.a.speed>2.9);
});
test('contacts respect elevation and a hard hit can detach the guide',()=>{
 const {track,a,b,engine}=pair();b.pose.z+=1.5;assert.equal(bodyContact(a,b),null);b.pose=track.pose(b.distance,b.lane);a.speed=4;b.speed=.5;
 resolveContacts(track,[a,b],engine);assert.equal(a.state,'derailed');assert.equal(b.state,'derailed');assert.equal(b.crash.hit,true);
});
test('After Effects export is self-contained parseable ExtendScript and safely quotes race labels',()=>{
 const text=afterEffectsScript({track:'Test " / \\ newline\n\u2028',lanes:4,duration:70,events:[{type:'derail',time:20,name:'Tu'}],rank:1,stars:3,credits:200});
 assert.doesNotThrow(()=>new vm.Script(text));assert.ok(text.includes('app.project.items.addComp'));assert.ok(text.includes('ADBE Mask Shape'));assert.ok(text.includes('markerProperty'));assert.ok(!text.includes('fetch('));
});
