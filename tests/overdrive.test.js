import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack,LEVELS} from '../src/track/catalog.js';
import {RaceSession} from '../src/game/session.js';
import {brakingAdvice} from '../src/game/braking-guide.js';
import {Profile} from '../src/game/profile.js';
import {DriverInput,PLAYER_KEYS} from '../src/input/state.js';
import {scoreStep,STEP} from '../src/audio/score.js';
const dt=1/120,gas={throttle:1,switchLane:false},off={throttle:0,switchLane:false};
for(let level=3;level<LEVELS.length;level++){
 test(`long circuit ${level}: closed modular path, smooth joins, safe slot geometry and real long straights`,()=>{
  const t=createTrack(level);assert.ok(t.length>55);assert.ok(t.segments?t.segments.some(s=>s.type==='line'&&s.length>12):t.straightLength>12);
  for(const seg of t.segments??[0,t.straightLength,t.halfLength,2*t.straightLength+t.arcLength].map(start=>({start}))){const a=t.sample(seg.start-1e-6),b=t.sample(seg.start+1e-6);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<3e-6);assert.ok(Math.hypot(a.tx-b.tx,a.ty-b.ty)<3e-6);}
  for(let s=0;s<t.length;s+=.17)for(const lane of [0,1]){const p=t.pose(s,lane);assert.ok(Number.isFinite(p.curvature));assert.ok(p.metric>.7);}
  for(const g of t.switches)for(let s=g.start;s<=g.end;s+=.1)assert.equal(t.sample(s).curvature,0);
 });
 test(`long circuit ${level}: full gas produces a slide, assisted driver completes three laps`,()=>{
  const s=new RaceSession();s.configure({level});s.reset('time');s.status='running';
  let maxSlip=0;for(let i=0;i<120*70&&s.player.crashes===0;i++){s.update(dt,gas);maxSlip=Math.max(maxSlip,s.player.skid);}assert.ok(s.player.crashes>0||maxSlip>.18,'full power must produce a visible warning on banked tracks');
  s.configure({assisted:true});s.reset('race');s.status='running';
  for(let i=0;i<120*360&&s.status!=='finished';i++)s.update(dt,{...gas,switchLane:i===1});
  assert.equal(s.status,'finished');assert.equal(s.player.laps,3);assert.equal(s.player.crashes-(s.player.contactCrashes||0),0);assert.equal(s.player.lane,1);
 });
}
test('coach tells a manual driver to lift before the first corner, without taking over',()=>{
 const s=new RaceSession();s.configure({level:3});s.reset('time');s.status='running';let warned=false,released=false;
 for(let i=0;i<120*40&&s.player.laps<1;i++){const a=brakingAdvice(s.track,s.player);if(a.action==='brake'){warned=true;released=true;assert.ok(s.player.speed>1);}s.update(dt,{throttle:a.action==='brake'?0:1});}
 assert.ok(warned&&released);assert.equal(s.player.crashes,0);assert.equal(s.player.laps,1);
 const p=s.player; p.speed=3.7;p.distance=24;const before=brakingAdvice(s.track,p);p.setup={...p.setup,engineBrake:p.setup.engineBrake*1.8};const after=brakingAdvice(s.track,p);assert.ok(after.distanceToBrake>before.distanceToBrake,'better brakes need less braking distance');
});
test('coaching defaults to first four circuits and can be enabled independently of assistance',()=>{const s=new RaceSession();for(let i=0;i<15;i++){s.level=i;assert.equal(s.guidanceEnabled,i<4);}s.guidance='on';assert.equal(s.guidanceEnabled,true);assert.equal(s.assisted,false);s.guidance='off';assert.equal(s.guidanceEnabled,false);});
test('three human inputs independently control gas, queued switches and recovery',()=>{
 const s=new RaceSession();s.reset('local3');s.status='running';assert.equal(s.players.length,3);assert.equal(s.drivers.size,0);
 for(let i=0;i<120;i++)s.update(dt,[gas,off,off]);assert.ok(s.cars[0].distance>.3);assert.equal(s.cars[1].speed,0);assert.equal(s.cars[2].speed,0);
 s.update(dt,[off,{throttle:0,switchLane:true},off]);assert.equal(s.cars[1].switchQueued,true);assert.equal(s.cars[0].switchQueued,false);
 for(let i=0;i<120*8;i++)s.update(dt,[gas,off,gas]);assert.ok(s.cars[0].crashes>0&&s.cars[2].crashes>0);assert.equal(s.cars[1].crashes,0);
 assert.deepEqual(s.cars[0].setup,s.cars[2].setup);
});
test('local race waits for other humans, ranks actual finish times and times out stalled drivers',()=>{
 const s=new RaceSession();s.reset('local3');s.status='running';for(const c of s.cars){c.distance=3*s.track.length+.08-.002;c.laps=2;c.speed=1;c.pose=s.track.pose(c.distance,c.lane);}
 s.cars[2].distance=0;s.cars[2].speed=0;s.update(dt,[gas,gas,off]);assert.equal(s.status,'running');assert.ok(s.cars[0].finishedAt!==null);assert.ok(s.cars[1].finishedAt!==null);assert.equal(s.cars[2].finishedAt,null);
 for(let i=0;i<120*31;i++)s.update(dt,[off,off,off]);assert.equal(s.status,'finished');assert.equal(s.standings().at(-1).id,'p3');assert.equal(new Profile().complete(s),null);
});
test('local race ends immediately after the last human finishes, not after the timeout',()=>{const s=new RaceSession();s.reset('local2');s.status='running';for(const c of s.cars){c.distance=3*s.track.length+.079;c.laps=2;c.speed=1;c.pose=s.track.pose(c.distance,c.lane);}s.update(dt,[gas,gas]);assert.equal(s.status,'finished');assert.equal(s.players.length,2);});
test('switch-compatible input state isolates three simultaneous players and clears only a crashing car',()=>{const states=PLAYER_KEYS.map(()=>new DriverInput());states[0].press('keyboard');states[1].press('pointer-7',true);states[2].press('pointer-8');states[1].pendingSwitch=true;assert.deepEqual(states.map(s=>s.read().throttle),[1,1,1]);states[0].clear();assert.deepEqual(states.map(s=>s.throttle),[0,1,1]);states[1].press('pointer-9',true);assert.equal(states[1].throttle,0);assert.equal(states[1].read().switchLane,false);});
test('existing three-track progress and records migrate to fifteen tracks without losing upgrades',()=>{const p=new Profile({getItem:()=>JSON.stringify({unlocked:2,credits:220,upgrades:{motor:2,grip:1,brake:3},medals:[3,2,1],records:{'rivalry-3:0:race:club:manual:0:0:0':12.2}})});assert.equal(p.data.medals.length,15);assert.deepEqual(p.data.medals.slice(0,3),[3,2,1]);assert.equal(p.data.credits,220);assert.equal(p.data.upgrades.motor,2);assert.equal(Object.values(p.data.records)[0],12.2);const s=new RaceSession();s.configure({level:14});s.status='finished';p.complete(s);assert.equal(p.data.unlocked,14);});
test('original score has four kicks per bar, alternating phrases and finite pitches',()=>{assert.ok(STEP>.1&&STEP<.12);let kicks=0;for(let i=0;i<256;i++){const step=scoreStep(i);if(i<16&&step.kick)kicks++;for(const note of [step.bass,step.lead])assert.ok(note===null||Number.isFinite(note));}assert.equal(kicks,4);assert.notDeepEqual(scoreStep(0),scoreStep(128));});
