import test from 'node:test';
import assert from 'node:assert/strict';
import { RaceSession } from '../src/game/session.js';
import { Profile } from '../src/game/profile.js';
import { MEETINGS,passingLaneClear,trafficAhead } from '../src/game/club.js';
const step=1/120;
test('season rewards, promotion and old wallets survive reload',()=>{
 let value=JSON.stringify({credits:50});
 const store={getItem:()=>value,setItem:(_,v)=>{value=v;}};
 const profile=new Profile(store),s=new RaceSession();
 for (const [round,event] of MEETINGS.entries()){
   s.clubRound=round;s.reset('campaign');s.status='finished';
   s.player.finishedAt=10;
   if(event.rank<3){
     s.cars.slice(1).forEach(c=>c.finishedAt=9);
     assert.equal(profile.complete(s).qualified,false);assert.equal(profile.data.clubWins,round);
     s.reset('campaign');s.status='finished';s.player.finishedAt=10;
   }
   const previous=profile.data.credits,bonus=profile.complete(s);
   assert.equal(bonus.qualified,true);assert.equal(profile.data.credits,previous+bonus.credits);
   assert.ok(bonus.credits>event.bonus);assert.equal(profile.complete(s),null);
   assert.equal(new Profile(store).data.clubWins,round+1);
 }
 assert.ok(profile.upgrade('motor'));
});
test('a human can take an occupied crossover while AI checks its actual target lane',()=>{
 const s=new RaceSession();s.reset('campaign');s.status='running';
 const [p,r]=s.cars,entry=s.track.switches[0].start+.03;
 p.distance=s.track.length+entry;p.pose=s.track.pose(p.distance,p.lane);
 r.lane=s.track.switchTarget(s.track.switches[0],p.lane);r.distance=entry+.1;r.pose=s.track.pose(r.distance,r.lane);
 assert.equal(passingLaneClear(s.track,p,s.cars),false);
 s.update(step,{throttle:0,switchLane:true});assert.ok(p.change);assert.equal(p.switchQueued,false);
 r.lane=p.lane;r.distance=entry+.6;assert.ok(trafficAhead(s.track,p,s.cars)<1);
});
test('all club tracks have traversable X modules and the assisted car can finish three laps',()=>{
 for(const [round] of MEETINGS.entries()){
   const s=new RaceSession();s.clubRound=round;s.reset('campaign');s.assisted=true;
   for(const gate of s.track.switches)for(let x=gate.start;x<=gate.end;x+=.10)assert.equal(s.track.sample(x).curvature,0);
   s.start();
   for(let i=0;i<120*360&&s.status!=='finished';i++)s.update(step,{throttle:1,switchLane:i%440===90});
   assert.equal(s.status,'finished',String(round));assert.equal(s.player.laps,3);
 }
});
