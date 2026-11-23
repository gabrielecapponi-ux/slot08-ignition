import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack} from '../src/track/catalog.js';
import {MEETINGS} from '../src/game/tour.js';
import {RaceSession} from '../src/game/session.js';

test('all arcade roads have room for four lanes and special modules have vertical clearance',()=>{
 const themes=new Set();let spirals=0,crossings=0,jumps=0;
 for(const [id,m] of MEETINGS.entries()){
  const t=createTrack(m.level,{lanes:4,variant:id}), arcs=t.segments.filter(s=>s.type==='arc');
  themes.add(t.theme);assert.ok(arcs.length>=7);assert.ok(arcs.every(a=>a.radius>.75));
  if(t.base.spiral){
   const arc=t.base.spiral,a=t.sample(arc.start+.1),b=t.sample(arc.start+.1+2*Math.PI*arc.radius);
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);
   assert.ok(Math.abs(b.z-a.z)>1.4);spirals++;
  }else if(t.level.subtitle.startsWith('Scavalco')){
   const under=t.segments.find(line=>line.type==='line'&&line.y>0&&line.ty<-.99&&line.y+line.ty*line.length<0);
   const lower=t.sample(under.start-under.y/under.ty),top=t.sample(lower.x-t.segments[0].x);
   assert.ok(Math.hypot(top.x-lower.x,top.y-lower.y)<.01);assert.ok(top.z-lower.z>1.7);crossings++;
  }
  if(t.jump){jumps++;if(t.fork)assert.ok(t.jump.start+t.jump.length<t.fork.start);}
 }
 assert.equal(themes.size,10);assert.ok(spirals>=10&&crossings>=8&&jumps>=5);
});

test('launch speed determines whether the car clears the gap',()=>{
 for(const speed of [1,3]){
  const s=new RaceSession();s.clubRound=4;s.reset('campaign');const c=s.player,j=s.track.jump;
  c.distance=j.start-.002;c.speed=speed;c.pose=s.track.pose(c.distance,c.lane);
  s.physics.step(c,1,1/120);
  if(speed<j.minSpeed){assert.equal(c.state,'derailed');assert.ok(c.crash.shortJump);}
  else{assert.equal(c.state,'slotted');c.distance=j.start+j.length*.5;s.physics.step(c,1,1/120);assert.ok(c.pose.z>s.track.pose(c.distance,c.lane).z+.29);}
 }
});
