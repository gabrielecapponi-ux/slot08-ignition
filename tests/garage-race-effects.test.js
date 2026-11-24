import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceSession} from '../src/game/session.js';
import {AIDriver} from '../src/ai/driver.js';
test('equipped parts change eight-car race forces and full-throttle acceleration',()=>{
 function run(appearance){
  const s=new RaceSession();s.configure({appearance});const car=s.player;
  for(let i=0;i<90;i++)s.physics.step(car,1,1/120);
  return car;
 }
 const stock=run({}),modified=run({wheels:10,wing:10,aero:10,hood:10,exhaust:10});
 assert.ok(modified.maxGrip>stock.maxGrip&&modified.setup.aerodynamicDrag<stock.setup.aerodynamicDrag);
 assert.ok(modified.speed>stock.speed&&modified.distance>stock.distance);
});
test('rival lifts for a wreck ahead in its path but ignores a different deck',()=>{
 const s=new RaceSession(),car=s.cars[1],p=car.pose;car.speed=3;
 const rival=s.cars[2];rival.state='derailed';
 rival.crash={x:p.x+.37*p.tx,y:p.y+.37*p.ty,z:p.z+.077};
 const input=()=>new AIDriver(s.track,1,{tactical:true}).input(car,1/120,[car,rival]);
 input();const blocked=car.targetSpeed;rival.crash.z+=1;input();
 assert.ok(car.targetSpeed>blocked);
});
