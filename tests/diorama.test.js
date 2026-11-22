import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';
register('../scripts/three-test-loader.mjs',import.meta.url);
const {AssetKit,parseCompressedKit}=await import('../src/render/asset-kit.js');
const {dressCircuit}=await import('../src/render/diorama.js');
const {createLandscape}=await import('../src/track/landscape.js');
const {createTrack}=await import('../src/track/catalog.js');

test('the ten Blender miniatures load with vertex colours and stage clear of every road deck',async()=>{
  const bytes=await readFile(new URL('../assets/diorama.glb.gz',import.meta.url));
  assert.ok(bytes.length<150*1024);
  const kit=new AssetKit().ingest(await parseCompressedKit(bytes));
  assert.equal(kit.items.size,10);
  for(const model of kit.items.values()){
    model.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.getAttribute('color'));});
  }
  const seen=new Set();
  for(let i=0;i<15;i++){
    const track=createTrack(i),field=createLandscape(track),occupied=[];
    let seed=808+i*113,count=0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    dressCircuit(track,field,kit,occupied,(name,p)=>{
      assert.ok(field.distance(p.x,p.y)>=.67+p.scale*kit.footprint('PROP_'+name));
      assert.ok(Number.isFinite(p.z)&&Number.isFinite(p.angle));
      seen.add(name);count++;
    },random);
    assert.ok(count>=5,`world ${i} placed only ${count} miniatures`);
  }
  assert.equal(seen.size,10);
});

test('verges follow the ground and fade clear of the elevated decks, within the mobile geometry budget',async()=>{
  const {trackVerge}=await import('../src/render/diorama.js');
  let faded=false,pebbles=false;
  for(let i=0;i<15;i++){
    const track=createTrack(i),root=trackVerge(track);
    const mesh=root.getObjectByName('Trackside apron'),g=mesh.geometry;
    const elevations=g.getAttribute('position'),tints=g.getAttribute('color');
    assert.equal(tints.itemSize,4);
    for(let k=0;k<tints.count;k+=4){
      assert.equal(tints.getW(k+3),0);
      assert.ok(elevations.getY(k)<=.021);
      if(tints.getW(k)===0)faded=true;
    }
    assert.ok(g.index.count/3<track.length*90);
    const chips=root.getObjectByName('Shoulder gravel');
    if(chips){pebbles=true;assert.ok(chips.count<track.length*12);}
  }
  assert.ok(faded&&pebbles);
});
