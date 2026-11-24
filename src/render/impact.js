import * as THREE from 'three';

// Three small emitters share one texture. Sparks follow the point of impact in world space.
export class ImpactEffects {
  constructor(scene) {
    this.map=new THREE.TextureLoader().load(new URL('../../assets/impact-spark.png',import.meta.url).href);
    this.map.colorSpace=THREE.SRGBColorSpace;
    this.emitters=Array.from({length:8},()=>{
      const positions=new Float32Array(14*3);
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
      const material=new THREE.PointsMaterial({map:this.map,size:.054,depthWrite:false,
        blending:THREE.AdditiveBlending,transparent:true,toneMapped:false});
      const mesh=new THREE.Points(geometry,material);
      mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
      const tails=new Float32Array(14*6),ribbon=new THREE.BufferGeometry();
      ribbon.setAttribute('position',new THREE.BufferAttribute(tails,3).setUsage(THREE.DynamicDrawUsage));
      const lines=new THREE.LineSegments(ribbon,new THREE.LineBasicMaterial({color:0xffa451,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending}));
      lines.frustumCulled=false;mesh.add(lines);
      return {mesh,positions,tails,lines,crash:null,burst:-1};
    });
  }
  update(cars,enabled) {
    this.emitters.forEach((emitter,index)=>{
      const car=cars[index],crash=enabled&&car?.crash,mesh=emitter.mesh;
      mesh.visible=false;
      if(!crash){
        emitter.crash=null;
        if(!enabled||!car||car.skid<.22||car.state!=='slotted')return;
        const p=car.pose,phase=car.distance*5+index;
        if(Math.floor(phase)%3>(car.skid>.48?1:0))return;
        const t=(phase%1)*.14;
        for(let i=0;i<14;i++){
          const back=.09+t*(.8+(i%5)*.36),spread=Math.sin(i*2.4)*t*.42;
          emitter.positions[i*3]=p.x-p.tx*back+p.nx*spread;
          emitter.positions[i*3+1]=p.z+.083+t*(.5+i%3*.19)-t*t*3;
          emitter.positions[i*3+2]=p.y-p.ty*back+p.ny*spread;
        }
        this.streaks(emitter,p.x-p.tx*.09,p.z+.083,p.y-p.ty*.09);mesh.material.color.setRGB(1,.85,.54);
        mesh.geometry.attributes.position.needsUpdate=true;mesh.material.opacity=.8;mesh.visible=true;return;
      }
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
      this.streaks(emitter,emitter.x,emitter.y,emitter.z);
      mesh.material.color.setRGB(1,.94-t*1.4,.77-t*1.8);mesh.material.opacity=(1-t/.38)**1.4;mesh.visible=true;
    });
  }
  streaks(emitter,x,y,z){
    const {positions,tails,lines}=emitter;
    for(let i=0;i<14;i++){
      const a=i*3,k=i*6,length=.25+(i%4)*.058;
      tails[k]=positions[a];tails[k+1]=positions[a+1];tails[k+2]=positions[a+2];
      tails[k+3]=positions[a]+(x-positions[a])*length;
      tails[k+4]=positions[a+1]+(y-positions[a+1])*length;
      tails[k+5]=positions[a+2]+(z-positions[a+2])*length;
    }
    lines.geometry.attributes.position.needsUpdate=true;
  }
  destroy(){for(const {mesh,lines} of this.emitters){lines.geometry.dispose();lines.material.dispose();mesh.removeFromParent();mesh.material.dispose();mesh.geometry.dispose();}this.map.dispose();}
}
