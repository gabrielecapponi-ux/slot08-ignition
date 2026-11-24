import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceSession} from '../src/game/session.js';
import {PHYSICS} from '../src/core/config.js';
import {updateGrip} from '../src/physics/grip.js';
test('at 405 km/h a lift slows the car and buys time to recover a loaded rear axle',()=>{
 const s=new RaceSession(),car=s.player;car.speed=6.25;car.throttle=0;
 const loaded={...car,throttle:1};
 for(const c of [car,loaded]){c.lateralForce=c.maxGrip*1.65;for(let i=0;i<24;i++)updateGrip(c,.4,1/120);}
 assert.ok(car.instability<loaded.instability*.6);
 const before=car.speed;s.physics.step(car,0,1/120);
 assert.ok(car.speed<before);assert.ok(before*PHYSICS.modelScale*3.6>400);
});
