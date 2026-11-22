import * as THREE from 'three';

// Stock wheels arrive as four wheels in a single Blender mesh per material.
// Keep the calipers in the body batch and spin the other surfaces around each axle.
export function carSurface(name) {
  if (/^GT_(tyre|alloy|wheel_spoke)/.test(name)) return 'wheel';
  if (name === 'GT_tail_signature') return 'stop';
  if (name === 'GT_LED_signature') return 'headlight';
  return '';
}

function stockAxles(source) {
  const tyre = source?.getObjectByName('GT_tyre');
  if (!tyre?.isMesh) return null;
  const bounds = [new THREE.Box3(), new THREE.Box3()];
  const point = new THREE.Vector3();
  const vertices = tyre.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    point.fromBufferAttribute(vertices, i).applyMatrix4(tyre.matrixWorld);
    bounds[Number(point.x > 0)].expandByPoint(point);
  }
  if (bounds.some(box => box.isEmpty())) return null;
  const [rear, front] = bounds.map(box => box.getCenter(new THREE.Vector3()));
  return { pivots: new THREE.Vector4(rear.x, rear.y, front.x, front.y), radius: (bounds[0].max.y - bounds[0].min.y) / 2 };
}

function rollingMaterial(material, pivots, turn) {
  const wheel = material.clone();
  wheel.onBeforeCompile = shader => {
    shader.uniforms.slotAxles = { value: pivots };
    shader.uniforms.slotTurn = turn;
    shader.vertexShader = 'uniform vec4 slotAxles;\nuniform vec2 slotTurn;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      mat2 wheelRotation = mat2(slotTurn.x, slotTurn.y, -slotTurn.y, slotTurn.x);
      objectNormal.xy = wheelRotation * objectNormal.xy;
      #ifdef USE_TANGENT
        objectTangent.xy = wheelRotation * objectTangent.xy;
      #endif
    `).replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec2 pivot = position.x > 0.0 ? slotAxles.zw : slotAxles.xy;
      transformed.xy = pivot + wheelRotation * (position.xy - pivot);
    `);
  };
  wheel.customProgramCacheKey = () => 'slot-stock-wheel-v1';
  return wheel;
}

export function installCarMotion(root, source) {
  const axles = stockAxles(source);
  const motion = { turn: { value: new THREE.Vector2(1, 0) }, wheels: [], radius: axles?.radius || .033, angle: 0, distance: null, brake: null };
  root.userData.motion = motion;
  root.traverse(node => {
    if (!node.isMesh) return;
    const role = node.userData.carSurface;
    if (role === 'wheel' && axles) {
      node.material = rollingMaterial(node.material, axles.pivots, motion.turn);
      node.userData.ownMaterial = true;
    }
    if (role === 'stop' || role === 'headlight') {
      node.material = node.material.clone();
      node.userData.ownMaterial = true;
      node.material.emissiveIntensity = role === 'stop' ? .55 : 1.65;
      if (role === 'stop') motion.brake = node.material;
    }
  });
  const set = root.children.find(node => /^PART_wheels_/.test(node.name));
  // Precision wheel sets have a local origin at each hub. Two assemblies face
  // in the opposite direction, so their local Z rotations need the opposite sign.
  if (set) for (const hub of set.children) {
    const rotor = new THREE.Group();
    const rotating = hub.children.filter(node => node.isMesh && !/caliper/i.test(node.material.name));
    if (!rotating.length) continue;
    const rubber = rotating.find(node => /tyre compound/i.test(node.material.name));
    if (rubber) {
      rubber.geometry.computeBoundingBox();
      const box = rubber.geometry.boundingBox;
      motion.radius = (box.max.y - box.min.y) / 2;
    }
    hub.add(rotor);
    rotor.add(...rotating);
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(hub.quaternion).z;
    motion.wheels.push({ rotor, sign: Math.sign(direction) || 1 });
  }
  return motion;
}

export function updateCarMotion(root, car, dt) {
  const motion = root.userData.motion;
  if (!motion) return;
  if (Number.isFinite(car.distance)) {
    if (motion.distance !== null && car.distance >= motion.distance) {
      const travel = (car.distance - motion.distance) * (car.pose?.metric || 1);
      motion.angle = (motion.angle - travel / motion.radius) % (2 * Math.PI);
    }
    motion.distance = car.distance;
    motion.turn.value.set(Math.cos(motion.angle), Math.sin(motion.angle));
    for (const { rotor, sign } of motion.wheels) rotor.rotation.z = sign * motion.angle;
  }
  if (motion.brake) {
    const braking = car.state === 'slotted' && car.speed > .25 && car.throttle < .45;
    const target = braking ? 3.4 : .55;
    motion.brake.emissiveIntensity = THREE.MathUtils.damp(motion.brake.emissiveIntensity, target, 20, dt);
  }
}
