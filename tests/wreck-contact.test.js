import test from 'node:test';
import assert from 'node:assert/strict';
import {hitsWreck} from '../src/physics/contacts.js';
const tick=1/120;
const car=(x,y=0)=>({pose:{x,y,z:0,tx:1,ty:0,angle:0},speed:4});
const wreck={x:0,y:0,z:.077+.122,vx:0,vy:0,vz:0,angle:0,roll:Math.PI};
test('a roof-down wreck catches an approaching bumper and a crossing during the tick',()=>{
 assert.ok(hitsWreck(wreck,car(-.27),tick));
 assert.ok(hitsWreck(wreck,car(.31),tick));
});
test('cars on another lane or under an airborne wreck pass clear',()=>{
 assert.equal(hitsWreck(wreck,car(0,.29),tick),false);
 assert.equal(hitsWreck({...wreck,z:.8},car(0),tick),false);
});

import {RaceSession} from '../src/game/session.js';
test('an overturned car starts a pileup in an eight-car race',()=>{
 const race=new RaceSession();race.configure({level:0,assisted:false});race.status='running';
 assert.equal(race.cars.length,8);
 const [first,second,third]=race.cars;
 for(const [i,c] of [first,second,third].entries()){
  c.lane=1;c.distance=14-i*.31;c.pose=race.track.pose(c.distance,c.lane);c.speed=i?4:0;
 }
 race.physics.derail(first,first.pose);
 Object.assign(first.crash,{roll:Math.PI,rollSpeed:0,vx:0,vy:0,vz:0,z:first.pose.z+.199});
 for(let i=0;i<16;i++)race.update(tick,{throttle:0});
 assert.equal(second.crash?.other,third.id);
 assert.equal(third.crash?.other,second.id);
 assert.equal(third.contactCrashes,1);
});
