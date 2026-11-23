import test from 'node:test';
import assert from 'node:assert/strict';
import {fittingTravel,mechanicalView} from '../src/render/installation.js';
import {createTrack} from '../src/track/catalog.js';
import {MEETINGS} from '../src/game/tour.js';
test('all twelve replacement assemblies reach their own mounted position',()=>{
 for(const key of ['motor','grip','brake','brush','gearing','diffuser','wing','hood','wheels','aero','lights','exhaust']){
   assert.ok(Math.hypot(...fittingTravel(key,0))>.045);
   assert.ok(Math.hypot(...fittingTravel(key,1250))<1e-8);
 }
 assert.ok(mechanicalView('motor'));assert.ok(!mechanicalView('wing'));
});
test('four lanes rotate around the raised deck and clear the tunnel shell',()=>{
 for(const variant of [2,11,21,38,46]){
   const t=createTrack(MEETINGS[variant].level,{lanes:4,variant}),zone=t.base.rollZone;
   const center=t.sample(zone.start+zone.span*.5);
   assert.ok(center.z>1);assert.ok(Math.cos(center.stuntRoll)<-.99);assert.ok(!center.tunnel);
   const left=t.pose(center.s,0),right=t.pose(center.s,3);
   assert.ok((right.x-left.x)*center.nx+(right.y-left.y)*center.ny<0);
 }
});
