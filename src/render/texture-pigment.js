import * as THREE from 'three';
const swatches=new WeakMap();
const carbon=new THREE.Color('#363b40');
// Read the embedded albedo once. The compatibility rasterizer has no GPU sampler.
export function texturePigment(material,uv,i){
 const map=material.map;
 if(!map)return material.color;
 if(!swatches.has(map)){
   let pixels=null;
   if(typeof document!=='undefined'&&map.image?.width){
     try{
       const c=document.createElement('canvas');c.width=c.height=32;
       const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(map.image,0,0,32,32);
       pixels=ctx.getImageData(0,0,32,32).data;
     }catch{}
   }
   swatches.set(map,pixels);
 }
 const data=swatches.get(map);
 if(!data||!uv)return /carbon/i.test(material.name)?carbon:material.color;
 const wrap=x=>((Math.floor(x*32)%32)+32)%32;
 const off=4*(wrap(uv.getX(i))+32*wrap(map.flipY?1-uv.getY(i):uv.getY(i)));
 return new THREE.Color().setRGB(data[off]/255,data[off+1]/255,data[off+2]/255,THREE.SRGBColorSpace).multiply(material.color);
}
