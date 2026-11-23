import * as THREE from 'three';
// Render saved hues with richer pigment; neutral paints and the saved choice stay intact.
export function vividPaint(value){
 const color=new THREE.Color(value),hsl={};color.getHSL(hsl,THREE.SRGBColorSpace);
 if(hsl.s>.15)color.setHSL(hsl.h,Math.min(1,hsl.s*1.28+.07),Math.min(.64,hsl.l*1.045),THREE.SRGBColorSpace);
 return color;
}
