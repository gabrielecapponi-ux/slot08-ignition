import * as THREE from 'three';
// Render saved hues with richer pigment; neutral paints and the saved choice stay intact.
export function vividPaint(value){
 const color=new THREE.Color(value),hsl={};color.getHSL(hsl,THREE.SRGBColorSpace);
 if(hsl.s>.15)color.setHSL(hsl.h,Math.min(1,hsl.s*1.45+.13),Math.min(.535,hsl.l*1.10),THREE.SRGBColorSpace);
 return color;
}

// A shallow clear-lacquer relief breaks up broad highlights in workshop close-ups.
export function lacquerTexture(){
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x*Math.PI*2/size,v=y*Math.PI*2/size,i=(y*size+x)*4;
  data[i]=128+Math.round(28*Math.cos(9*u+3*Math.sin(5*v))+15*Math.cos(13*u-7*v));
  data[i+1]=128+Math.round(25*Math.cos(8*v+2*Math.sin(4*u))-13*Math.cos(13*u-7*v));
  data[i+2]=252;data[i+3]=255;
 }
 const map=new THREE.DataTexture(data,size,size);
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(11,11);
 map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;
 map.needsUpdate=true;return map;
}

// Model coordinates work on Blender tyres without UVs. Fine mould grain
// changes the width of a highlight without changing the round tyre silhouette.
export function finishTyres(root){
 root.traverse(n=>{
   const m=n.material;
   if(!m||m.userData.tyreFinish||!/vulcanized_rubber|Graphite tyre compound|Embossed rubber/i.test(m.name))return;
   m.roughness=.70;m.metalness=.025;m.userData.tyreFinish=true;
   m.onBeforeCompile=shader=>{
     shader.vertexShader='varying vec3 rubberLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrubberLocal=position;');
     shader.fragmentShader='varying vec3 rubberLocal;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
       vec3 tireCell=floor(rubberLocal*5200.);
       float grain=fract(sin(dot(mod(tireCell,127.),vec3(13.3,31.1,7.7)))*1745.7);
       float fade=1.-smoothstep(.3,2.,length(fwidth(rubberLocal))*5200.);
       roughnessFactor+=(grain-.5)*.22*fade;`);
   };
   m.customProgramCacheKey=()=>'slot-rubber-finish';
 });
}
