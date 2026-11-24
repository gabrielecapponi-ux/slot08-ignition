import * as THREE from 'three';
import { bodyPose } from '../physics/grip.js';

/** Bounded pools: two draw calls, no per-frame geometry or texture allocations. */
export class SkidEffects {
  constructor(scene) {
    this.matrix = new THREE.Object3D(); this.cursor = 0; this.puffCursor = 0;
    this.last = new Map(); this.marks = Array.from({ length: 320 }, () => ({ life: 0 }));
    this.puffs = Array.from({ length: 192 }, () => ({ life: 0 }));
    this.ink = new THREE.InstancedMesh(new THREE.PlaneGeometry(.09, .014),
      new THREE.MeshBasicMaterial({ color: '#0a0c10', transparent: true, opacity: .74, depthWrite: false }), this.marks.length);
    const size=128,pixels=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1;
      const folds=Math.sin(u*11+2*Math.sin(v*7))*Math.cos(v*9-u*4);
      const d=Math.hypot(u+.06*Math.sin(v*8),v+.07*Math.cos(u*7));
      const density=Math.min(1,Math.max(0,(1-d)*2.7+folds*.16));
      const shade=Math.round(224+24*folds);
      pixels.set([shade,shade,Math.min(255,shade+5),Math.round(238*density*density)],4*(y*size+x));
    }
    this.smokeTexture=new THREE.DataTexture(pixels,size,size);
    this.smokeTexture.generateMipmaps=true;this.smokeTexture.minFilter=THREE.LinearMipmapLinearFilter;
    this.smokeTexture.magFilter=THREE.LinearFilter;this.smokeTexture.needsUpdate=true;
    this.smoke = new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),
      new THREE.MeshBasicMaterial({ color: '#d9dce0',map:this.smokeTexture,transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide }), this.puffs.length);
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
  update(cars, dt, camera, wet = false) {
    if (dt <= 0) return;
    for (const car of cars) {
      const spray=wet&&!car.pose?.tunnel&&car.speed>1.15;
      if (car.state !== 'slotted' || (!spray && car.skid < .10) || car.speed < .3) { this.last.delete(car.id); continue; }
      const p = bodyPose(car.pose, car.driftAngle), old = this.last.get(car.id);
      if (old && Math.hypot(p.x - old.x, p.y - old.y) < (spray?.13:.055)) continue;
      this.last.set(car.id, p);
      const tx = Math.cos(p.angle), ty = Math.sin(p.angle);
      for (const side of [-1, 1]) {
        const x = p.x - tx * .10 - ty * side * .058, z = p.y - ty * .10 + tx * side * .058;
        if(!spray)Object.assign(this.marks[this.cursor++ % this.marks.length], { x, y: p.z + .079, z, angle: p.angle, life: 12 });
        if (spray || car.skid > .16) {
          const i = this.puffCursor++ % this.puffs.length;
          Object.assign(this.puffs[i], { x, y: p.z + .10, z, vx: spray?-tx*.32-ty*side*.19:-tx*.10+Math.sin(i)*.05, vz: spray?-ty*.32+tx*side*.19:-ty*.10+Math.cos(i)*.05, life: spray?.38:1.05, duration:spray?.38:1.05, size:spray?.036:.048+.026*car.skid });
        }
      }
    }
    let inkChanged=false, smokeChanged=false;
    this.marks.forEach((p, i) => {
      if(!p.life)return;
      const priorLife=p.life;
      p.life = Math.max(0, p.life - dt);
      if(priorLife<12 && p.life>=1)return;
      inkChanged=true; this.matrix.position.set(p.x || 0, p.y || 0, p.z || 0);
      this.matrix.rotation.set(-Math.PI / 2, 0, -(p.angle || 0)); this.matrix.scale.setScalar(Math.min(1, p.life)); this.matrix.updateMatrix(); this.ink.setMatrixAt(i, this.matrix.matrix);
    });
    this.puffs.forEach((p, i) => {
      if(!p.life)return;
      p.life = Math.max(0, p.life - dt);
      smokeChanged=true;
      if (p.life) { p.x += p.vx * dt; p.z += p.vz * dt; p.y += (.10+.12*(.72-p.life))*dt; }
      this.matrix.position.set(p.x || 0, p.y || 0, p.z || 0); if(camera)this.matrix.quaternion.copy(camera.quaternion);else this.matrix.rotation.set(0, i, i);
      this.matrix.scale.setScalar(p.life ? (p.size + (p.duration - p.life) * .22) * Math.min(1, p.life / .18) : 0);
      this.matrix.updateMatrix(); this.smoke.setMatrixAt(i, this.matrix.matrix);
    });
    if(inkChanged)this.ink.instanceMatrix.needsUpdate=true;
    if(smokeChanged)this.smoke.instanceMatrix.needsUpdate=true;
  }
  destroy() { this.smokeTexture.dispose();for (const mesh of [this.ink, this.smoke]) { mesh.removeFromParent(); mesh.dispose(); mesh.geometry.dispose(); mesh.material.dispose(); } }
}
