import test from 'node:test';
import assert from 'node:assert/strict';
import { FLEET, MEETINGS, WORLDS, nextCampaignRace, openWorld } from '../src/game/tour.js';
import { Profile } from '../src/game/profile.js';

test('each world offers five different races and needs eight local stars',()=>{
  assert.equal(MEETINGS.length,50);
  for(const [,levels] of WORLDS)assert.equal(new Set(levels).size,5);
  const stars=Array(50).fill(0);
  stars.splice(0,5,3,2,1,1,0);
  assert.equal(openWorld(stars),0);
  stars[4]=1;
  assert.equal(openWorld(stars),FLEET[1].world);
  stars.fill(2,5,20);
  assert.equal(openWorld(stars),FLEET[2].world);
  assert.ok(FLEET[2].speed>FLEET[1].speed && FLEET[1].speed>FLEET[0].speed);
});

test('legacy finishes retain their original circuits and wallet',()=>{
  const medals=Array(15).fill(2);
  const profile=new Profile({getItem:()=>JSON.stringify({clubWins:6,credits:481,medals})});
  const tracks=MEETINGS.filter((_,i)=>profile.data.results[i]).map(m=>m.level);
  assert.deepEqual(tracks,[0,1,2,7,10,14]);
  assert.equal(profile.data.credits,481);
});

test('garage trim is validated and persists across reloads',()=>{
  let saved=null;
  const storage={getItem:()=>saved,setItem:(_,v)=>{saved=v;}};
  const profile=new Profile(storage);
  assert.ok(profile.equip('seat','#a83232'));
  assert.ok(profile.equip('glass','#486881'));
  assert.equal(profile.equip('glass','invalid'),false);
  assert.equal(new Profile(storage).data.appearance.seat,'#a83232');
  assert.equal(new Profile(storage).data.appearance.glass,'#486881');
});

import { RaceSession } from '../src/game/session.js';

test('a loose car can strike a rival in its path but cannot hit through a bridge',()=>{
  for(const [height,expected] of [[0,'derailed'],[1.8,'slotted']]){
    const session=new RaceSession();
    session.reset('campaign');
    session.status='running';
    const [player,rival]=session.cars;
    rival.speed=2;
    session.physics.derail(player,player.pose);
    Object.assign(player.crash,{x:rival.pose.x,y:rival.pose.y,z:rival.pose.z+.077+height,vx:0,vy:0});
    session.update(1/120,{throttle:0});
    assert.equal(rival.state,expected);
  }
});

test('one starter is available and eight cars unlock through the tour',()=>{
  assert.equal(FLEET.length,9);
  assert.deepEqual(FLEET.filter(car=>car.world===0).map(car=>car.name),['GT-08 Club']);
  const events=new RaceSession();
  events.carIndex=0;
  events.reset('campaign');
  assert.equal(events.player.chassis,0);
  assert.equal(new Set(events.cars.map(car=>car.chassis)).size,1);
  assert.ok(events.cars.every(car=>FLEET[car.chassis].world===0));
  assert.equal(new Profile({getItem:()=>JSON.stringify({car:8})}).data.car,0);
  assert.equal(new Profile({getItem:()=>JSON.stringify({car:4,vehicles:{4:{}}})}).data.car,4);
});

test('gravity slows a climbing car and accelerates it downhill in every race mode',()=>{
  const s=new RaceSession();
  for(const mode of ['time','race','campaign','local2']){
    s.reset(mode);
    const speeds=[-.2,0,.2].map(pitch=>{
      const car={...s.player,speed:2};
      const p={...car.pose,pitch,curvature:0,bank:0};
      const engine=new s.physics.constructor({pose:()=>p});
      engine.step(car,.65,1/120);
      return car.speed;
    });
    assert.ok(speeds[0]>speeds[1] && speeds[1]>speeds[2],mode);
  }
});

test('campaign continues, retries and respects world gates on saved results',()=>{
 const stars=Array(50).fill(0);
 stars[0]=1; assert.equal(nextCampaignRace(0,stars),0);
 stars[0]=2; assert.equal(nextCampaignRace(0,stars),1);
 stars.splice(0,5,2,1,0,1,2);assert.equal(nextCampaignRace(4,stars),2);
 stars[2]=2;assert.equal(nextCampaignRace(4,stars),5);
 stars.fill(2);assert.equal(nextCampaignRace(49,stars),null);
});
