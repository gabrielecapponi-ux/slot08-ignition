import * as THREE from 'three';
import {trackPoint} from './safety-rail.js';
import {createLandscape} from '../track/landscape.js';

// Each particle has a fixed impact site on an exposed piece of road.
// Batched quads descend in world space; rain opens into a ring at the same site.
export function precipitation(track){
 const kind=track.weather;
 if(!['rain','snow','sand'].includes(kind))return null;
 const field=createLandscape(track),points=[],corners=[],phases=[],normals=[],indices=[];
 let seed=537+track.index;
 const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let s=0;s<track.length;s+=.115){
  const p=track.sample(s);
  if(p.tunnel||p.stuntRoll||p.loopMetric||track.jump&&s>=track.jump.start&&s<=track.jump.start+track.jump.length)continue;
  const d=(random()-.5)*(track.width-.04),q=trackPoint(p,d,.082);
  if([...field.nearby(q.x,q.z)].some(v=>v.z>q.y+.22 && Math.hypot(v.x-q.x,v.y-q.z)<track.width*.52))continue;
  const up=new THREE.Vector3(p.nx*Math.sin(p.bank)-p.tx*p.grade,Math.cos(p.bank),p.ny*Math.sin(p.bank)-p.ty*p.grade).normalize();
  const i=phases.length,phase=random();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
   points.push(q.x,q.y,q.z);corners.push(x,y);phases.push(phase);normals.push(up.x,up.y,up.z);
  }
  indices.push(i,i+1,i+2,i+2,i+1,i+3);
 }
 const geo=new THREE.BufferGeometry();
 for(const [key,data,n] of [['position',points,3],['corner',corners,2],['offsetPhase',phases,1],['upAxis',normals,3]])geo.setAttribute(key,new THREE.Float32BufferAttribute(data,n));
 geo.setIndex(indices);geo.computeBoundingSphere();if(geo.boundingSphere)geo.boundingSphere.radius+=2;
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{clock:{value:0},kind:{value:kind==='rain'?0:kind==='snow'?1:2}},
 vertexShader:`attribute vec2 corner;attribute float offsetPhase;attribute vec3 upAxis;
 uniform float clock,kind;varying vec2 uvDrop;varying float ring,life;
 void main(){
 float t=fract(offsetPhase+clock*(.8+.4*offsetPhase)*(kind<.5?2.15:kind<1.5?.49:1.3));
 ring=kind<.5?step(.76,t):0.;life=ring>.5?(t-.76)/.24:t;
 vec3 p=position;uvDrop=corner;
 if(ring>.5){
 vec3 tangent=normalize(cross(upAxis,vec3(0.,0.,1.)));
 p+=(tangent*corner.x+cross(upAxis,tangent)*corner.y)*(.012+.047*life);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 }else{
 float h=kind<.5?1.65*(1.-t/.76):kind<1.5?1.18*(1.-t):.04+.16*sin(3.14159*t);
 p+=vec3(kind>1.5?(t-.5)*.9:kind>.5?.08*sin(t*6.28+offsetPhase*23.):h*.10,h,0.);
 vec4 eye=modelViewMatrix*vec4(p,1.);
 eye.xy+=corner*vec2(kind<.5?.003:.008,kind<.5?.067:.008);
 gl_Position=projectionMatrix*eye;
 }}
 `,fragmentShader:`uniform float kind;varying vec2 uvDrop;varying float ring,life;
 void main(){float r=length(uvDrop);float a=ring>.5?(1.-smoothstep(.06,.25,abs(r-.73)))*(1.-life):max(0.,1.-r*r);
 if(a<.03)discard;vec3 c=kind<.5?vec3(.72,.86,.95):kind<1.5?vec3(.94,.98,1.):vec3(.77,.60,.36);
 gl_FragColor=vec4(c,a*(ring>.5?.65:.68));}`});
 const mesh=new THREE.Mesh(geo,mat);mesh.name='Precipitazioni sulla carreggiata';mesh.renderOrder=2;return mesh;
}
