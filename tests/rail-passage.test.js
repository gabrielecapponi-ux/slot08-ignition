import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createTrack, LEVELS } from '../src/track/catalog.js';
import { railSites, passageGlint } from '../src/render/rail-passage.js';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {ConductorGlints}=await import('../src/render/conductor-glints.js');

test('track glints use sparse curved conductor sites, clear of junctions and roofs',()=>{
  for(let id=0;id<LEVELS.length;id++){
    const track=createTrack(id),sites=railSites(track);
    assert.ok(sites.length>0);
    sites.forEach((site,i)=>{
      assert.ok(Math.abs(site.p.curvature)>=.10);
      assert.ok(!track.tunnelAt?.(site.at,.60));
      assert.ok(!track.switches.some(g=>site.at>g.start-.3&&site.at<g.end+.3));
      if(i)assert.ok(site.at-sites[i-1].at>5);
    });
  }
});

test('glints stay on the lane, fade with distance and respect motion and light direction',()=>{
  const track=createTrack(0),sites=railSites(track),site=sites[0];
  const car={state:'slotted',speed:3,distance:site.at-.43,lane:0};
  const hit=passageGlint(track,sites,car);
  assert.ok(hit.amount>.99);
  const second=passageGlint(track,sites,{...car,lane:1});
  assert.ok(Math.hypot(hit.x-second.x,hit.y-second.y,hit.z-second.z)>.2);
  assert.ok(passageGlint(track,sites,{...car,distance:car.distance+.24}).amount<hit.amount);
  for(const change of [{change:{}},{speed:.1},{state:'crashed'},{distance:car.distance+1}]){
    assert.equal(passageGlint(track,sites,{...car,...change}),null);
  }
  const glints=new ConductorGlints(),sun=new THREE.DirectionalLight(),camera=new THREE.PerspectiveCamera();
  const session={track,cars:[car]};camera.position.set(hit.x,hit.y+5,hit.z);sun.position.set(0,10,0);
  glints.update(session,camera,sun,true);
  assert.equal(glints.root.children.filter(m=>m.visible).length,1);
  const strength=glints.root.children[0].material.uniforms.strength.value;
  camera.position.set(hit.x+site.p.tx*4,hit.y+.2,hit.z+site.p.ty*4);
  glints.update(session,camera,sun,true);
  assert.ok(glints.root.children[0].material.uniforms.strength.value<strength);
  glints.update(session,camera,sun,false);assert.equal(glints.root.visible,false);
});
