import * as THREE from 'three';
import { passageGlint, railSites } from './rail-passage.js';

export class ConductorGlints {
  constructor(){
    const material=new THREE.ShaderMaterial({
      uniforms:{strength:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`varying vec2 vUv;uniform float strength;
      void main(){vec2 d=abs(vUv*2.0-1.0);
        float core=exp(-d.x*d.x*5.0-d.y*d.y*27.0);
        float halo=exp(-d.x*d.x*8.0-d.y*d.y*4.2)*.23;
        gl_FragColor=vec4(1.0,.93,.76,(core+halo)*strength);}
      `
    });
    this.root=new THREE.Group();const geo=new THREE.PlaneGeometry(.20,.040);
    geo.rotateX(-Math.PI/2);
    for(let i=0;i<3;i++){const mesh=new THREE.Mesh(geo,i?material.clone():material);mesh.visible=false;mesh.renderOrder=2;mesh.rotation.order='YXZ';this.root.add(mesh);}
    this.eye=new THREE.Vector3();this.light=new THREE.Vector3();this.half=new THREE.Vector3();
  }
  update(session,camera,sun,enabled){
    this.root.visible=enabled;
    if(!enabled)return;
    if(this.track!==session.track){this.track=session.track;this.sites=railSites(this.track);}
    this.light.copy(sun.position).sub(sun.target.position).normalize();
    this.root.children.forEach((mesh,i)=>{
      mesh.visible=false;
      const car=session.cars[i],hit=car&&passageGlint(this.track,this.sites,car);
      if(!hit)return;
      mesh.position.set(hit.x,hit.y,hit.z);
      this.eye.copy(camera.position).sub(mesh.position).normalize();
      this.half.copy(this.eye).add(this.light).normalize();
      const along=this.half.x*Math.cos(hit.angle)+this.half.z*Math.sin(hit.angle);
      const spec=Math.exp(-along*along*4.5);
      mesh.material.uniforms.strength.value=hit.amount*spec*.92;
      mesh.rotation.set(0,-hit.angle,hit.pitch,'YZX');
      mesh.visible=mesh.material.uniforms.strength.value>.018;
    });
  }
}
