import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { Scene3D } = await import('../src/render/scene3d.js');
const { AssetKit, parseCompressedKit } = await import('../src/render/asset-kit.js');
const { installCarMotion, updateCarMotion } = await import('../src/render/wheel-motion.js');

test('all nine stock chassis roll on measured tyres and illuminate only their rear lenses when lifting', async () => {
  const loader = new GLTFLoader();
  for (let chassis = 0; chassis < 9; chassis++) {
    const bytes = await readFile(new URL('../assets/fleet-'+chassis+'.glb',import.meta.url));
    const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const source = gltf.scene.getObjectByName('CAR_GT');
    source.removeFromParent();
    const root = Scene3D.prototype.batch(source);
    const motion = installCarMotion(root,source);
    const wheel = root.children.find(n => n.userData.carSurface === 'wheel');
    const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader };
    wheel.material.onBeforeCompile(shader);
    const axes = shader.uniforms.slotAxles.value;
    assert.ok(axes.x < -.07 && axes.z > .07 && axes.y > .02 && axes.w > .02);
    assert.ok(motion.radius > .02 && motion.radius < .045);
    const car = {distance: 0, pose: {metric: 1.05}, speed: 2, throttle: 1, state:'slotted'};
    updateCarMotion(root,car,.05);
    car.distance = motion.radius*Math.PI/2/1.05;
    car.throttle = 0;
    updateCarMotion(root,car,.05);
    assert.ok(Math.abs(motion.turn.value.y+1)<1e-6 && Math.abs(motion.turn.value.x)<1e-6);
    assert.ok(motion.brake.emissiveIntensity>2);
    assert.equal(source.getObjectByName('GT_tail_signature').material.emissiveIntensity,source.getObjectByName('GT_brake_caliper').material.emissiveIntensity);
    assert.notEqual(motion.brake, source.getObjectByName('GT_brake_caliper').material);
    assert.ok(root.children.some(n=>n.userData.carSurface==='headlight' && n.material.emissiveIntensity>1));
  }
});

test('ten wheel kits spin around all four local hubs while the four brake calipers remain on the chassis', async () => {
  globalThis.self=globalThis;
  globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
  const kit = new AssetKit();
  kit.ingest(await parseCompressedKit(await readFile(new URL('../assets/parts.glb.gz',import.meta.url))));
  for (let version=1;version<=10;version++) {
    const root=new THREE.Group(), set=kit.clone('PART_wheels_'+version);
    root.add(set);
    const motion=installCarMotion(root,null);
    assert.equal(motion.wheels.length,4);
    const car = {distance:0,speed:1,throttle:1,state:'slotted'};
    updateCarMotion(root,car,.04);
    car.distance=motion.radius*Math.PI/2;
    updateCarMotion(root,car,.04);
    assert.equal(motion.wheels.filter(w=>w.sign===1).length,2);
    for (const {rotor,sign} of motion.wheels) {
      assert.ok(Math.abs(rotor.rotation.z+sign*Math.PI/2)<1e-6);
      assert.ok(rotor.parent.children.some(n=>n.isMesh&&/caliper/i.test(n.material.name)));
      assert.ok(rotor.children.some(n=>/rotor/i.test(n.material.name)));
    }
  }
});
