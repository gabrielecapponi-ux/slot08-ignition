import * as THREE from 'three';
import { drawSector } from '../track/sectors.js';
export const ATMOSPHERES={
 forest:{top:'#347b92',horizon:'#d4e9c6',sun:'#fff2b3',low:'#6b8c72'},
 alpine:{top:'#3974ad',horizon:'#e5f1f0',sun:'#ffffff',low:'#90acbd'},
 harbor:{top:'#466aa4',horizon:'#f4b993',sun:'#ffe7ab',low:'#667e9b'},
 coast:{top:'#1985b5',horizon:'#c8efe2',sun:'#fff1c2',low:'#62969b'},
 canyon:{top:'#625a99',horizon:'#f5ae79',sun:'#ffe0a3',low:'#aa766c'},
 desert:{top:'#4e9bb9',horizon:'#ffe0a5',sun:'#fff7d9',low:'#c6a77a'},
 night:{top:'#080f2c',horizon:'#354a78',sun:'#dfedff',low:'#1d2c4c'},
};
export function skyTexture(theme,variant=0,mobile=false,sector){
 const a=ATMOSPHERES[theme]??ATMOSPHERES.forest,c=document.createElement('canvas');c.width=mobile?1024:2048;c.height=mobile?512:1024;
 const ctx=c.getContext('2d');ctx.scale(c.width/2048,c.height/1024);const g=ctx.createLinearGradient(0,0,0,1024);g.addColorStop(0,a.top);g.addColorStop(.48,a.horizon);g.addColorStop(.65,a.low);g.addColorStop(1,a.low);ctx.fillStyle=g;ctx.fillRect(0,0,2048,1024);
 let seed=108+variant;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(theme==='night')for(let i=0;i<260;i++){ctx.globalAlpha=.3+rnd()*.65;ctx.fillStyle='#eff7ff';ctx.beginPath();ctx.arc(rnd()*2048,rnd()*420,.7+rnd()*1.2,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;const sx=420+variant*61%850,sy=512-1024*lightingProfile(theme,variant).altitude/Math.PI;
 const glow=ctx.createRadialGradient(sx,sy,4,sx,sy,150);glow.addColorStop(0,a.sun+'99');glow.addColorStop(1,a.sun+'00');ctx.fillStyle=glow;ctx.fillRect(sx-150,sy-150,300,300);ctx.fillStyle=a.sun;ctx.beginPath();ctx.arc(sx,sy,theme==='night'?16:25,0,Math.PI*2);ctx.fill();
 if(theme!=='night')for(let i=0;i<20;i++){
   const x=rnd()*2048,y=175+rnd()*207,w=45+rnd()*118,stretch=.12+rnd()*.10;
   // Feather overlapping cloud lobes. Wrap both sides of the panorama seam.
   for(let j=0;j<8;j++){
     const xx=x+(rnd()-.5)*w*1.7,yy=y+(rnd()-.5)*12,r=w*(.27+rnd()*.50);
     for(const offset of [-2048,0,2048]){
       if(xx+offset+r<0||xx+offset-r>2048)continue;
       ctx.save();ctx.translate(xx+offset,yy);ctx.scale(1,stretch);
       const vapour=ctx.createRadialGradient(0,0,0,0,0,r);vapour.addColorStop(0,'#fff8e126');vapour.addColorStop(.55,'#fff8e115');vapour.addColorStop(1,'#fff8e100');
       ctx.fillStyle=vapour;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
     }
   }
 }
 ctx.globalAlpha=1;
 for(let layer=0;layer<3;layer++){ctx.fillStyle=[a.low+'55',a.low+'99',a.low][layer];ctx.beginPath();ctx.moveTo(0,700);for(let x=0;x<=2048;x+=8){const h=470+layer*23-Math.abs(Math.sin(x*.004+layer+variant))*(theme==='alpine'?90:42)-Math.sin(x*.015+layer)*13;ctx.lineTo(x,h);}ctx.lineTo(2048,1024);ctx.lineTo(0,1024);ctx.fill();}
 if(Number.isInteger(sector))drawSector(ctx,2048,1024,sector);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;return texture;
}

// One key light supplies the only shadow map. The hemisphere and reverse fill
// retain detail inside cockpits and on the shaded faces of buildings.
const LIGHT={
 forest:['#ffe1a5','#c0d8ed','#605442',3.20,1.04,.36,32],
 alpine:['#fff0d2','#c7e2ff','#8a9597',3.0,1.11,.43,39],
 harbor:['#ffc98e','#afc9e3','#696061',3.22,1.05,.34,24],
 coast:['#ffdea1','#b4dff2','#a39478',3.05,1.13,.37,31],
 canyon:['#ffc88d','#b7c7df','#926351',3.23,1.02,.34,26],
 desert:['#ffe3b0','#bfdbea','#a29077',3.12,1.11,.38,34],
 night:['#b6d9ff','#879bbd','#555263',1.91,.78,.53,29],
};
export function lightingProfile(theme,variant,indoors=false){
 const [key,sky,bounce,power,ambient,fill,altitude]=LIGHT[theme]??LIGHT.forest;
 const sunU=(420+variant*61%850)/2048;
 return {key:indoors?'#ffdcab':key,sky:indoors?'#bdd2e1':sky,bounce:indoors?'#826c54':bounce,
   power:indoors?3.0:power,ambient:indoors?1.08:ambient,fill:indoors?.46:fill,
   azimuth:indoors?2.55:2*Math.PI*(sunU-.5),altitude:(indoors?33:altitude)*Math.PI/180};
}
