import * as THREE from 'three';
// Render saved hues with richer pigment; neutral paints and the saved choice stay intact.
export function vividPaint(value){
 const color=new THREE.Color(value),hsl={};color.getHSL(hsl,THREE.SRGBColorSpace);
 if(hsl.s>.15)color.setHSL(hsl.h,Math.min(1,hsl.s*1.22+.06),Math.min(.60,hsl.l),THREE.SRGBColorSpace);
 return color;
}
