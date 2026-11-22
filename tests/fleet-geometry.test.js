import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
const {VehicleModels}=await import('../src/render/vehicle-models.js');
const {SoftwareGarage}=await import('../src/render/garage-software.js');

test('each chassis loads once at slot scale and supplies its own painted, glazed body',async()=>{
  const models=new VehicleModels();
  const bodies=new Set(),calls=new Map(),loader=new GLTFLoader();
  models.loader.loadAsync=async url=>{
    calls.set(url,(calls.get(url)||0)+1);
    const bytes=await readFile(new URL(url));
    return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  };
  for(let chassis=0;chassis<9;chassis++){
    const [a,b]=await Promise.all([models.load(chassis),models.load(chassis)]);
    assert.ok(a);assert.equal(a,b);assert.equal(models.forChassis(chassis),a);
    const size=new THREE.Box3().setFromObject(a).getSize(new THREE.Vector3());
    assert.ok(size.x>.25&&size.x<.43&&size.y>.06&&size.y<.17);
    const colors=new Set();
    a.traverse(n=>{if(n.isMesh)colors.add(n.material.name);});
    assert.ok(colors.has('MAT_lime_enamel')&&colors.has('MAT_smoked_glass'));
    const body=a.getObjectByName('GT_body');assert.ok(body);
    bodies.add(Buffer.from(body.geometry.attributes.position.array.buffer,body.geometry.attributes.position.array.byteOffset,body.geometry.attributes.position.array.byteLength).toString('base64'));
    const projected=SoftwareGarage.prototype.mesh.call({},a,{chassis,appearance:{decal:1,paint:'#b31f55'}},false);
    assert.ok(projected.faces.length>1000);
    assert.ok(projected.vertices.every(p=>Number.isFinite(p.x+p.y+p.z)));
  }
  assert.equal(bodies.size,9);
  assert.equal(calls.size,9);
  assert.ok([...calls.values()].every(count=>count===1));
  models.destroy();assert.equal(models.templates.size,0);
});
