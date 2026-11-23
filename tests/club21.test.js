import test from 'node:test';
import assert from 'node:assert/strict';
import { PhysicsEngine } from '../src/physics/engine.js';
import { carSetup } from '../src/game/setup.js';
import { RaceSession } from '../src/game/session.js';
import { stuntBase, STUNTS } from '../src/track/stunts.js';

test('the rolling hull clears a flat deck through flight, rebound and roof contact',()=>{
  const race=new RaceSession(), engine=new PhysicsEngine(race.track), car=race.player;
  const p=car.pose;
  engine.field={height:()=>0,nearby:()=>[{...p,x:car.crash.x,y:car.crash.y,z:0,bank:0}]};
  car.speed=4;engine.derail(car,{...p,z:0});
  let rise=false,rebound=false,rolled=false;
  for(let i=0;i<260;i++){
    const c=car.crash,falling=c.vz<-.3;
    engine.step(car,0,1/120);
    const depth=.086*Math.abs(Math.sin(c.roll))+.122*Math.max(0,-Math.cos(c.roll));
    assert.ok(c.z-depth>=.077-1e-9);
    rise ||= c.z>.18;rebound ||= falling&&c.vz>0;rolled ||= Math.cos(c.roll)<0;
  }
  assert.ok(rise&&rebound&&rolled);
});

test('the loop inverts the deck and returns to an upright exit',()=>{
  const track=stuntBase(STUNTS.masone),{start,span,radius}=track.loopZone;
  const crown=track.sample(start+span*.5);
  assert.ok(Math.cos(crown.loopPitch)<-.99);
  assert.ok(crown.z>=radius*2-1e-6);
  assert.ok(Math.abs(track.sample(start+span-.001).loopPitch)<.01);
});

test('pickup, gearing and underbody each change their own physical coefficient',()=>{
  const stock=carSetup(),modified=carSetup('club',{brush:3,gearing:4,diffuser:5});
  assert.ok(modified.motorForce>stock.motorForce);
  assert.ok(modified.maxSpeed>stock.maxSpeed);
  assert.ok(modified.aerodynamicDrag<stock.aerodynamicDrag);
});
