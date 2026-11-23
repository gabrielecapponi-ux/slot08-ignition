import * as THREE from 'three';
import { bodyPose } from '../physics/grip.js';

/** Bounded pools: two draw calls, no per-frame geometry or texture allocations. */
export class SkidEffects {
  constructor(scene) {
    this.matrix = new THREE.Object3D(); this.cursor = 0; this.puffCursor = 0;
    this.last = new Map(); this.marks = Array.from({ length: 320 }, () => ({ life: 0 }));
    this.puffs = Array.from({ length: 96 }, () => ({ life: 0 }));
    this.ink = new THREE.InstancedMesh(new THREE.PlaneGeometry(.09, .014),
      new THREE.MeshBasicMaterial({ color: '#0a0c10', transparent: true, opacity: .74, depthWrite: false }), this.marks.length);
    const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);const i=(y*32+x)*4;pixels.set([255,255,255,Math.round(255*Math.max(0,1-d)**2)],i);}
    this.smokeTexture=new THREE.DataTexture(pixels,32,32);this.smokeTexture.needsUpdate=true;
    this.smoke = new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),
      new THREE.MeshBasicMaterial({ color: '#d9dce0',map:this.smokeTexture,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide }), this.puffs.length);
    for (const mesh of [this.ink, this.smoke]) {
      mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
    }
    this.reset();
  }
  reset() {
    this.last.clear(); this.marks.forEach(p => p.life = 0); this.puffs.forEach(p => p.life = 0);
    this.matrix.scale.setScalar(0); this.matrix.updateMatrix();
    for (const [mesh, pool] of [[this.ink, this.marks], [this.smoke, this.puffs]]) {
      pool.forEach((_, i) => mesh.setMatrixAt(i, this.matrix.matrix)); mesh.instanceMatrix.needsUpdate = true;
    }
  }
  update(cars, dt, camera) {
    if (dt <= 0) return;
    for (const car of cars) {
      if (car.state !== 'slotted' || car.skid < .16 || car.speed < .3) { this.last.delete(car.id); continue; }
      const p = bodyPose(car.pose, car.driftAngle), old = this.last.get(car.id);
      if (old && Math.hypot(p.x - old.x, p.y - old.y) < .055) continue;
      this.last.set(car.id, p);
      const tx = Math.cos(p.angle), ty = Math.sin(p.angle);
      for (const side of [-1, 1]) {
        const x = p.x - tx * .10 - ty * side * .058, z = p.y - ty * .10 + tx * side * .058;
        Object.assign(this.marks[this.cursor++ % this.marks.length], { x, y: p.z + .079, z, angle: p.angle, life: 7 });
        if (car.skid > .29) {
          const i = this.puffCursor++ % this.puffs.length;
          Object.assign(this.puffs[i], { x, y: p.z + .10, z, vx: -tx * .10 + Math.sin(i) * .05, vz: -ty * .10 + Math.cos(i) * .05, life: .72 });
        }
      }
    }
    this.marks.forEach((p, i) => {
      if(!p.life)return;
      p.life = Math.max(0, p.life - dt); this.matrix.position.set(p.x || 0, p.y || 0, p.z || 0);
      this.matrix.rotation.set(-Math.PI / 2, 0, -(p.angle || 0)); this.matrix.scale.setScalar(Math.min(1, p.life)); this.matrix.updateMatrix(); this.ink.setMatrixAt(i, this.matrix.matrix);
    });
    this.puffs.forEach((p, i) => {
      if(!p.life)return;
      p.life = Math.max(0, p.life - dt);
      if (p.life) { p.x += p.vx * dt; p.z += p.vz * dt; p.y += .09 * dt; }
      this.matrix.position.set(p.x || 0, p.y || 0, p.z || 0); if(camera)this.matrix.quaternion.copy(camera.quaternion);else this.matrix.rotation.set(0, i, i);
      this.matrix.scale.setScalar(p.life ? (.025 + (.72 - p.life) * .09) * Math.min(1, p.life / .18) : 0);
      this.matrix.updateMatrix(); this.smoke.setMatrixAt(i, this.matrix.matrix);
    });
    this.ink.instanceMatrix.needsUpdate = true; this.smoke.instanceMatrix.needsUpdate = true;
  }
  destroy() { this.smokeTexture.dispose();for (const mesh of [this.ink, this.smoke]) { mesh.removeFromParent(); mesh.dispose(); mesh.geometry.dispose(); mesh.material.dispose(); } }
}
