import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrack } from '../src/track/catalog.js';
import { createLandscape } from '../src/track/landscape.js';
import { RaceSession } from '../src/game/session.js';
import { createCar } from '../src/physics/car.js';
import { updateGrip } from '../src/physics/grip.js';
import { carSetup } from '../src/game/setup.js';
import { normalizePower } from '../src/input/state.js';
import { Profile } from '../src/game/profile.js';
import { PARTS, UPGRADE_LIMIT } from '../src/game/workshop.js';

test('moderate overload remains recoverable for at least 800ms; sustained excess still derails',()=>{
 for(const difficulty of ['rookie','club','pro']){
  const car=createCar({setup:carSetup(difficulty)});car.throttle=1;
  car.lateralForce=car.maxGrip*(1-car.setup.powerGripLoss)*1.45;
  for(let i=0;i<96;i++)assert.equal(updateGrip(car,.4,1/120),false);
  assert.ok(car.skid>.4);assert.ok(car.instability<.5);
  car.lateralForce=car.maxGrip*.7;car.throttle=0;
  for(let i=0;i<120;i++)assert.equal(updateGrip(car,.4,1/120),false);
  assert.equal(car.instability,0);
  car.throttle=1;car.lateralForce=car.maxGrip*2.8;let derailed=false;
  for(let i=0;i<240;i++)derailed=updateGrip(car,.4,1/120)||derailed;
  assert.equal(derailed,true);
 }
});

test('Rookie stock cars can learn all fifteen circuits at 65 percent without exits',()=>{
 for(let level=0;level<15;level++){
  const s=new RaceSession();s.configure({level,difficulty:'rookie'});s.reset('time');s.status='running';
  for(let i=0;i<120*130&&s.player.laps<1;i++)s.update(1/120,{throttle:.65});
  assert.equal(s.player.laps,1,'complete track '+level);assert.equal(s.player.crashes,0,'recoverable at 65%: '+level);
 }
});

test('terrain cannot penetrate any roadway, and scenery has finite deterministic elevations',()=>{
 for(let level=0;level<15;level++){
  const t=createTrack(level),f=createLandscape(t);
  for(let s=0;s<t.length;s+=.6){const p=t.sample(s);for(const side of [-.65,0,.65])assert.equal(f.height(p.x+p.nx*side,p.y+p.ny*side),0);}
  let high=0;for(let x=t.bounds.minX;x<t.bounds.maxX;x+=1.1)for(let y=t.bounds.minY;y<t.bounds.maxY;y+=1.1){const h=f.height(x,y);assert.ok(Number.isFinite(h)&&h>=0);high=Math.max(high,h);assert.equal(h,f.height(x,y));}
  assert.ok(high>.02);
 }
});

test('sixty parts and twenty mechanical tiers migrate, save, and charge exactly once',()=>{
 let raw=JSON.stringify({credits:999999,upgrades:{motor:12,grip:3,brake:2},appearance:{wing:5},owned:['wing:5','bad:99'],records:{'worlds-5:old':33},medals:[3]});
 const storage={getItem:()=>raw,setItem:(_,v)=>raw=v},p=new Profile(storage);
 assert.equal(p.data.appearance.wing,5);assert.equal(p.data.upgrades.motor,12);
 let count=0;for(const [category,catalog]of Object.entries(PARTS))for(let value=1;value<catalog.names.length;value++){
  count++;assert.equal(p.equip(category,value),true);const paid=p.data.credits;
  assert.equal(p.equip(category,0),true);assert.equal(p.equip(category,value),true);assert.equal(p.data.credits,paid);
 }
 assert.equal(count,60);for(const key of ['motor','grip','brake'])while(p.data.upgrades[key]<UPGRADE_LIMIT)assert.equal(p.upgrade(key),true);
 assert.equal(p.upgrade('motor'),false);assert.equal(p.equip('wing',11),false);
 const saved=new Profile(storage);for(const category of Object.keys(PARTS)){assert.equal(saved.data.appearance[category],10);assert.ok(saved.owns(category,10));}
 assert.equal(saved.data.upgrades.motor,20);assert.equal(saved.data.records['worlds-5:old'],33);
});

test('fine gas steps clamp and reject nonfinite input',()=>{
 assert.equal(normalizePower(.67),.65);assert.equal(normalizePower(9),1);assert.equal(normalizePower(-9),.2);assert.equal(normalizePower(NaN),.65);
});

test('high speed motor load tightens full-throttle grip equally for both drivers',()=>{
 for(const ai of [false,true]){
  const car=createCar({ai,setup:carSetup('club')});
  car.speed=3;
  car.lateralForce=car.maxGrip;
  car.throttle=.85;
  updateGrip(car,.35,1/120);
  assert.equal(car.gripRatio,1/(1-.85*car.setup.powerGripLoss));
  car.throttle=1;
  updateGrip(car,.35,1/120);
  assert.ok(car.gripRatio>1/(1-car.setup.powerGripLoss));
  car.throttle=0;
  updateGrip(car,.35,1/120);
  assert.equal(car.gripRatio,1);
 }
});
