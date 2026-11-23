import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createTrack } from '../src/track/catalog.js';
register('../scripts/three-test-loader.mjs',import.meta.url);
const {buildModularTrack}=await import('../src/render/modular-track.js');
const {Canvas2D}=await import('../src/render/canvas2d.js');
const context={
  fillRect(){},fillText(){},createLinearGradient(){return {addColorStop(){}};}
};
globalThis.document={createElement:()=>({getContext:()=>context})};

test('rubber paths reduce roughness and silver crown is lighter than tarnished shoulders',()=>{
  const road=buildModularTrack(createTrack(1));
  const plastic=road.children.find(mesh=>mesh.material?.bumpMap);
  const finish=plastic.material.roughnessMap.image;
  const meanGloss=(d)=>{
    const x=Math.round((.5+d/.70)*(finish.width-1));
    let sum=0;
    for(let y=0;y<finish.height;y++)sum+=finish.data[(y*finish.width+x)*4+1];
    return sum/finish.height;
  };
  assert.ok(meanGloss(.145+.069)<meanGloss(.30)-70);
  assert.notEqual(plastic.material.map,plastic.material.roughnessMap);
  const wire=road.getObjectByName('Binario in acciaio spazzolato');
  assert.ok(wire.material.vertexColors);
  assert.ok(wire.material.isMeshPhysicalMaterial);assert.equal(wire.material.metalness,1);assert.ok(wire.material.roughnessMap.generateMipmaps);assert.equal(wire.geometry.attributes.uv.count,wire.geometry.attributes.position.count);assert.ok(plastic.material.metalness<.1);
  assert.ok(wire.geometry.attributes.color.getX(3)>wire.geometry.attributes.color.getX(0)+.4);
  const uv=plastic.geometry.attributes.uv;
  assert.ok(Array.from({length:uv.count/2},(_,i)=>uv.getX(2*i)).some(x=>Math.abs(x)>.012));
});

test('software road raster samples once and draws finite banked strokes and metal highlights',()=>{
  const track=createTrack(1),sample=track.sample.bind(track);
  let calls=0,lines=0,metalStrokes=0;
  track.sample=s=>{calls++;return sample(s);};
  const ctx={beginPath(){},moveTo(x,y){assert.ok(Number.isFinite(x+y));},
    lineTo(x,y){assert.ok(Number.isFinite(x+y));lines++;},
    createLinearGradient(){return {addColorStop(){}};},
    stroke(){if(typeof this.strokeStyle==='object')metalStrokes++;}};
  Canvas2D.prototype.road.call({ctx,track},0,track.length);
  assert.ok(calls<=Math.ceil(track.length/.065)+2);
  assert.ok(lines>calls*10);assert.ok(metalStrokes>4);
});
