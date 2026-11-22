import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrack} from '../src/track/catalog.js';
import {courseRevision} from '../src/track/championship.js';
import {MEETINGS} from '../src/game/tour.js';

test('24 advanced layouts add technical sectors without overlapping their four-lane road',()=>{
 let revised=0;
 for(const [id,m]of MEETINGS.entries()){
  if(courseRevision(id)!==16)continue;revised++;
  const t=createTrack(m.level,{lanes:4,variant:id}),arcs=t.segments.filter(s=>s.type==='arc');
  assert.ok(arcs.length>=10);assert.ok(arcs.every(a=>a.radius>1.4),'inner lanes have space');
  const ps=Array.from({length:Math.ceil(t.length/.5)},(_,i)=>t.sample(i*.5));
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
   const along=Math.min((j-i)*.5,t.length-(j-i)*.5);if(along<5)continue;
   const a=ps[i],b=ps[j];assert.ok(Math.abs(a.z-b.z)>.8||Math.hypot(a.x-b.x,a.y-b.y)>1.9,`road overlap on ${id}`);
  }
  for(const gate of t.switches)for(let s=gate.start;s<=gate.end;s+=.2)assert.ok(Math.abs(t.sample(s).curvature)<1e-8,'overtaking gate must stay on a straight');
  if(id%5===4)assert.ok(t.fork);
 }
 assert.equal(revised,24);
});
