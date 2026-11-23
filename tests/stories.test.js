import test from 'node:test';
import assert from 'node:assert/strict';
import { RaceSession } from '../src/game/session.js';
import { Profile } from '../src/game/profile.js';
import { createTrack } from '../src/track/catalog.js';
import { MEETINGS } from '../src/game/tour.js';
import { RACE } from '../src/core/config.js';
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};};

test('50 campaign courses have unique geometry, closed lanes and traversable branch joins',()=>{
 const signatures=new Set();
 for(const [id,meeting] of MEETINGS.entries()){
  const t=createTrack(meeting.level,{lanes:4,variant:id});
  signatures.add(Array.from({length:30},(_,i)=>{const p=t.sample(i*t.length/30);return [p.x,p.y,p.z].map(v=>v.toFixed(3)).join(',');}).join(';'));
  for(const lane of t.lanes){const a=t.pose(0,lane),b=t.pose(t.length,lane);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-6);for(let s=0;s<t.length;s+=.15){const p=t.pose(s,lane);assert.ok(Number.isFinite(p.x+p.y+p.z+p.metric+p.curvature));assert.ok(p.metric>.4);}}
  if(id%5===4){assert.ok(t.fork);const mid=(t.fork.start+t.fork.end)/2,a=t.pose(mid,1),b=t.pose(mid,2);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>1.7);for(const g of t.switches)assert.ok(g.end<t.fork.start||g.start>t.fork.end);}
 }
 assert.equal(signatures.size,50);
});

test('two timed laps create a sorted grid and a fresh three-lap race',()=>{
 const events=[],s=new RaceSession({onEvent:e=>events.push(e.type)});s.reset('campaign');s.assisted=true;assert.ok(s.beginQualifying());
 for(let i=0;i<120*240&&s.status!=='qualified';i++)s.update(1/120,{throttle:1,switchLane:false});
 assert.equal(s.status,'qualified');assert.equal(s.player.laps,2);assert.ok(events.includes('qualified'));assert.ok(!events.includes('finish'));assert.equal(s.grid.length,6);
 assert.ok(s.grid.every((p,i)=>i===0||p.time>=s.grid[i-1].time));const order=s.grid.map(p=>p.id);assert.ok(s.startGrid());assert.equal(s.phase,'race');assert.equal(s.status,'countdown');assert.equal(s.player.laps,0);
 order.forEach((id,i)=>{const car=s.cars.find(c=>c.id===id);assert.equal(car.gridPosition,i+1);assert.equal(car.distance,RACE.startDistance-.34*i);});
 assert.equal(new Set(s.cars.map(c=>c.lane)).size,4);
});

test('qualifying has no body contact and no race payout',()=>{
 const s=new RaceSession();s.reset('grandprix');s.beginQualifying();s.status='running';const [a,b]=s.cars;b.lane=a.lane;b.distance=a.distance+.05;a.speed=3;b.speed=.2;s.update(1/120,{throttle:1});assert.equal(a.contactCrashes||0,0);assert.equal(b.contactCrashes||0,0);s.status='qualified';assert.equal(new Profile(null).complete(s),null);
});

test('elimination takes the last car after grace and does not finish at three laps',()=>{
 const s=new RaceSession();s.reset('elimination');s.start();s.status='running';s.elapsed=44.999;
 s.cars.forEach((c,i)=>{c.distance=i*2+1;c.pose=s.track.pose(c.distance,c.lane);});
 s.update(1/120,{throttle:0});assert.equal(s.player.eliminatedAt,s.elapsed);assert.equal(s.status,'finished');assert.equal(s.standings().at(-1),s.player);
 const t=new RaceSession();t.reset('elimination');t.status='running';t.player.distance=RACE.startDistance+3*t.track.length+.1;t.player.laps=2;t.update(1/120,{throttle:0});assert.equal(t.player.finishedAt,null);assert.equal(t.status,'running');
});

test('every car retains its own upgrades, finishes and endgame tune across reload',()=>{
 const mem=store(),p=new Profile(mem);p.data.credits=20000;p.upgrade('motor');p.equip('paint','#2f6fed');const paint=p.data.appearance.paint;
 assert.equal(p.selectCar(3),false);p.data.results.fill(3,0,10);assert.ok(p.selectCar(3));assert.equal(p.data.upgrades.motor,3);p.upgrade('brake');p.selectCar(0);assert.equal(p.data.upgrades.motor,1);assert.equal(p.data.upgrades.brake,0);assert.equal(p.data.appearance.paint,paint);
 p.data.upgrades.motor=20;assert.ok(p.setTuning('sprint'));const loaded=new Profile(mem);assert.equal(loaded.vehicle.tuning,'sprint');loaded.selectCar(3);assert.equal(loaded.data.upgrades.brake,4);assert.equal(loaded.data.upgrades.motor,3);assert.ok(!loaded.setTuning('sprint'));
});

test('requested restart happens once, preserves old progress, and restores it',()=>{
 const mem=store(),p=new Profile(mem);p.data.credits=500;p.data.results[0]=3;p.data.upgrades.motor=4;p.save();assert.ok(p.beginNewArcadeOnce());assert.equal(p.data.credits,0);assert.equal(p.data.results[0],0);assert.ok(p.hasBackup);p.data.credits=25;p.save();const loaded=new Profile(mem);assert.ok(!loaded.beginNewArcadeOnce());assert.equal(loaded.data.credits,25);assert.ok(loaded.restorePrevious());assert.equal(loaded.data.credits,500);assert.equal(loaded.data.upgrades.motor,4);assert.equal(loaded.data.results[0],3);assert.ok(!new Profile(mem).beginNewArcadeOnce());
});

test('storage failure cannot erase existing career',()=>{const p=new Profile({getItem:()=>null,setItem:()=>{throw Error('quota');}});p.data.credits=420;assert.equal(p.beginNewArcadeOnce(),false);assert.equal(p.data.credits,420);});

test('rival development is bounded, applied between races and never copied from player upgrades',()=>{
 const p=new Profile(null),s=new RaceSession();s.clubRound=20;s.reset('campaign');const force=s.cars[1].setup.motorForce;s.player.finishedAt=10;s.status='finished';p.complete(s);assert.equal(s.cars[1].setup.motorForce,force);assert.ok(p.data.rivalRating[0]>0);s.rivalRating=[2,-1,1];s.upgrades={motor:20};s.reset('campaign');assert.deepEqual(s.cars.slice(1).map(c=>c.upgrades.motor),[6,3,5,4,4]);
});

test('endgame setups offer tradeoffs without raising the motor level limit',()=>{
 const s=new RaceSession();s.upgrades={motor:20};s.tuning='balanced';s.reset();const a={...s.player.setup},grip=s.player.maxGrip;s.tuning='sprint';s.reset();assert.ok(s.player.setup.motorForce>a.motorForce);assert.ok(s.player.maxGrip<grip);s.tuning='endurance';s.reset();assert.ok(s.player.setup.maxSpeed<a.maxSpeed);assert.ok(s.player.setup.engineBrake>a.engineBrake);
});

test('fork inner rails retain a spinning car on its branch',async()=>{
 const {collideBarriers}=await import('../src/physics/barriers.js');const t=createTrack(13,{lanes:4,variant:4}),p=t.sample((t.fork.start+t.fork.end)/2);
 const previous={x:p.x+p.nx*.95,y:p.y+p.ny*.95,z:.09};const crash={x:p.x+p.nx*.78,y:p.y+p.ny*.78,z:.09,vx:-p.nx*2,vy:-p.ny*2,vz:0,spin:1,rollSpeed:1};
 assert.ok(collideBarriers(crash,previous,[p],t.extraWidth));assert.ok(crash.vx*p.nx+crash.vy*p.ny>0);
});

test('fourth place does not display campaign stars that were not awarded',()=>{const p=new Profile(null),s=new RaceSession();s.reset('campaign');s.status='finished';s.player.finishedAt=12;s.cars.slice(1).forEach(c=>c.finishedAt=10);const r=p.complete(s);assert.equal(r.rank,6);assert.equal(r.stars,0);assert.equal(p.data.results[0],0);});
