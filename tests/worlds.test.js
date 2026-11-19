import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTrack,LEVELS} from '../src/track/catalog.js';
import {safeSpeed,PhysicsEngine} from '../src/physics/engine.js';
import {createCar} from '../src/physics/car.js';
import {RaceSession} from '../src/game/session.js';
import {Profile} from '../src/game/profile.js';
import {PARTS,PAINTS,DECALS,effectiveParts,UPGRADE_LIMIT} from '../src/game/workshop.js';
const dt=1/120;

test('all fifteen worlds have closed 3D surfaces, tunnels and banked corners',()=>{
 const themes=new Set();for(let level=0;level<LEVELS.length;level++){
  const t=createTrack(level);themes.add(t.theme);assert.ok(t.tunnels.length);let bank=0;
  for(let s=0;s<t.length;s+=.16){for(const lane of[0,1]){const p=t.pose(s,lane);for(const key of['x','y','z','pitch','bank','metric','curvature'])assert.ok(Number.isFinite(p[key]),`${level}/${s}/${key}`);assert.ok(p.metric>.75);assert.ok(p.z>=-.001,'banked slots stay above the terrain');bank=Math.max(bank,Math.abs(p.bank));} }
  assert.ok(bank>.08);for(const tunnel of t.tunnels){assert.ok(tunnel.end-tunnel.start>1);assert.ok(t.tunnelAt((tunnel.start+tunnel.end)/2));}
  for(const lane of[0,1]){const a=t.pose(t.length-1e-5,lane),b=t.pose(1e-5,lane);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.0001);}
 }assert.equal(themes.size,7);
});

test('spiral decks share XY but have more than 1.8 metres of vertical clearance',()=>{
 for(const level of[5,9,14]){const t=createTrack(level),b=t.base,lap=2*Math.PI*b.spiral.radius;
  for(let s=b.spiral.start;s+lap<b.spiralEnd;s+=.1){const a=t.sample(s),q=t.sample(s+lap);assert.ok(Math.hypot(a.x-q.x,a.y-q.y)<1e-8);assert.ok(q.z-a.z>1.8);}
 }
});

test('banking tilts both lanes consistently and raises the centrifugal speed limit',()=>{
 const t=createTrack(7);let distance=0;for(let s=0;s<t.length;s+=.1)if(Math.abs(t.sample(s).bank)>Math.abs(t.sample(distance).bank))distance=s;
 const p=t.sample(distance),a=t.pose(distance,0),b=t.pose(distance,1);assert.ok(Math.abs(p.bank)>.5);assert.ok(Math.abs(a.z-b.z)>.1);assert.ok(safeSpeed(p.curvature,.245,p.bank)>safeSpeed(p.curvature,.245)*1.5);
 const car=createCar({start:distance});car.pose=t.pose(distance,0);car.speed=3;new PhysicsEngine(t).step(car,0,dt);assert.equal(car.state,'slotted');assert.ok(car.gripRatio<1);
});

test('slope and banking metric equal physical lane distance, including within a crossover',()=>{
 for(const level of[1,5,7,14]){const t=createTrack(level);for(let s=0;s<t.length;s+=.67){const p=t.pose(s,1),a=t.pose(s-.001,1),b=t.pose(s+.001,1),numeric=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/.002;if(Math.abs(t.sample(s-.01).curvature-t.sample(s+.01).curvature)<.01)assert.ok(Math.abs(numeric-p.metric)<.005,`${level}:${s}`);}}
});

test('12 mechanical tiers, purchased cosmetics and old progress persist without repeat charges',()=>{
 let data=JSON.stringify({credits:99999,upgrades:{motor:3,grip:2,brake:1},medals:[3,2,1],records:{old:12}});const storage={getItem:()=>data,setItem:(_,v)=>data=v};const p=new Profile(storage);assert.equal(p.data.upgrades.motor,3);
 for(let i=3;i<UPGRADE_LIMIT;i++)assert.equal(p.upgrade('motor'),true);assert.equal(p.upgrade('motor'),false);
 const before=p.data.credits;assert.equal(p.equip('wing',5),true);assert.equal(p.data.credits,before-200);assert.equal(p.equip('wing',0),true);assert.equal(p.equip('wing',5),true);assert.equal(p.data.credits,before-200);
 for(const paint of PAINTS)assert.equal(p.equip('paint',paint),true);for(let d=0;d<DECALS.length;d++)assert.equal(p.equip('decal',d),true);
 const restored=new Profile(storage);assert.equal(restored.data.appearance.wing,5);assert.equal(restored.data.upgrades.motor,12);assert.equal(restored.data.records.old,12);assert.deepEqual(restored.data.medals.slice(0,3),[3,2,1]);
 const empty=new Profile();assert.equal(empty.equip('wing',5),false);assert.equal(empty.equip('wheels',99),false);assert.equal(empty.equip('paint','bad'),false);
});

test('automatic visible components grow with hardware; a manual choice overrides only that part',()=>{
 const original=effectiveParts({upgrades:{motor:0,grip:0,brake:0}}),upgraded=effectiveParts({upgrades:{motor:12,grip:12,brake:12}});for(const key of['hood','exhaust','aero','wheels'])assert.ok(upgraded[key]>original[key]);const custom=effectiveParts({upgrades:{motor:12},appearance:{hood:2}});assert.equal(custom.hood,2);
});

test('all three pilots and both bots receive exactly the same level-12 hardware',()=>{
 for(const mode of['race','local3']){const s=new RaceSession();s.configure({upgrades:{motor:12,grip:12,brake:12}});s.reset(mode);for(const c of s.cars)assert.deepEqual(c.setup,s.player.setup);}
});

test('Blender catalogue contains every runtime part and biome prop within the asset budget',()=>{
 const bytes=fs.readFileSync(new URL('../assets/worldkit.glb',import.meta.url));assert.ok(bytes.length<2500000);assert.equal(bytes.toString('ascii',0,4),'glTF');const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());const names=new Set(json.nodes.map(n=>n.name));for(const category of Object.keys(PARTS))for(let n=1;n<=5;n++)assert.ok(names.has(`PART_${category}_${n}`));for(const prop of['deer','fox','penguin','pine','oak','palm','cactus','tunnel_portal'])assert.ok(names.has('PROP_'+prop));assert.ok(names.has('ANIM_rotor'));assert.ok(names.has('ANIM_bird'));
});

test('three analog gas levels produce distinct acceleration without interfering between pilots',()=>{
 const s=new RaceSession();s.reset('local3');s.status='running';for(let i=0;i<120;i++)s.update(dt,[{throttle:.65},{throttle:.85},{throttle:1}]);assert.ok(s.cars[0].speed<s.cars[1].speed);assert.ok(s.cars[1].speed<s.cars[2].speed);for(const c of s.cars)assert.equal(c.crashes,0);
});
