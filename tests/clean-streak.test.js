import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceSession} from '../src/game/session.js';
import {RACE} from '../src/core/config.js';
for(const crash of [false,true]){
 test('eight-car lap awards with mid-race crash '+crash,()=>{
  const rewards=[],s=new RaceSession({onEvent:e=>{if(e.type==='lap'&&!e.car.ai) rewards.push(e.lapBonus);}});
  s.status='running';
  for(let lap=1;lap<=3;lap++){
   const car=s.player;car.distance=RACE.startDistance+s.track.length*lap-.002;car.speed=1;
   car.pose=s.track.pose(car.distance,car.lane);if(crash&&lap===2)car.crashes++;
   s.update(1/120,{throttle:1});
  }
  assert.deepEqual(rewards,crash?[35,0,35]:[35,50,65]);
  assert.equal(s.player.cleanCredits,crash?70:150);
 });
}
