import * as THREE from 'three';

// Three small emitters share one texture. Sparks follow the point of impact in world space.
export class ImpactEffects {
  constructor(scene) {
    this.map=new THREE.TextureLoader().load(new URL('../../assets/impact-spark.png',import.meta.url).href);
    this.map.colorSpace=THREE.SRGBColorSpace;
    this.emitters=Array.from({length:6},()=>{
      const positions=new Float32Array(14*3);
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      const material=new THREE.PointsMaterial({map:this.map,size:.098,depthWrite:false,
        blending:THREE.AdditiveBlending,transparent:true,toneMapped:false});
      const mesh=new THREE.Points(geometry,material);
      mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
      return {mesh,positions,crash:null,burst:-1};
    });
  }
  update(cars,enabled) {
    this.emitters.forEach((emitter,index)=>{
      const car=cars[index],crash=enabled&&car?.crash,mesh=emitter.mesh;
      mesh.visible=false;
      if(!crash){emitter.crash=null;return;}
      if(emitter.crash!==crash){emitter.crash=crash;emitter.burst=-1;}
      const age=3-car.recoverIn,burst=crash.contacts||0;
      if(burst!==emitter.burst){
        Object.assign(emitter,{burst,start:age,x:crash.x,y:crash.z+.035,z:crash.y,heading:crash.angle});
      }
      const t=age-emitter.start;
      if(t>.38)return;
      for(let i=0;i<14;i++){
        const angle=emitter.heading+1.5+i*2.39996, speed=.33+(i%5)*.24;
        emitter.positions[i*3]=emitter.x+Math.cos(angle)*t*speed;
        emitter.positions[i*3+1]=emitter.y+Math.max(-.02,(.38+i%4*.19)*t-2.8*t*t);
        emitter.positions[i*3+2]=emitter.z+Math.sin(angle)*t*speed;
      }
      mesh.geometry.attributes.position.needsUpdate=true;
      mesh.material.opacity=1-t/.38;mesh.visible=true;
    });
  }
  destroy(){for(const {mesh} of this.emitters){mesh.removeFromParent();mesh.material.dispose();mesh.geometry.dispose();}this.map.dispose();}
}
