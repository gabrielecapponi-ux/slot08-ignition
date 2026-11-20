import * as THREE from 'three';
export const ATMOSPHERES={
 forest:{top:'#347b92',horizon:'#d4e9c6',sun:'#fff2b3',low:'#6b8c72'},
 alpine:{top:'#3974ad',horizon:'#e5f1f0',sun:'#ffffff',low:'#90acbd'},
 harbor:{top:'#466aa4',horizon:'#f4b993',sun:'#ffe7ab',low:'#667e9b'},
 coast:{top:'#1985b5',horizon:'#c8efe2',sun:'#fff1c2',low:'#62969b'},
 canyon:{top:'#625a99',horizon:'#f5ae79',sun:'#ffe0a3',low:'#aa766c'},
 desert:{top:'#4e9bb9',horizon:'#ffe0a5',sun:'#fff7d9',low:'#c6a77a'},
 night:{top:'#080f2c',horizon:'#354a78',sun:'#dfedff',low:'#1d2c4c'},
};
export function skyTexture(theme,variant=0){
 const a=ATMOSPHERES[theme]??ATMOSPHERES.forest,c=document.createElement('canvas');c.width=2048;c.height=1024;
 const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,1024);g.addColorStop(0,a.top);g.addColorStop(.48,a.horizon);g.addColorStop(.65,a.low);g.addColorStop(1,a.low);ctx.fillStyle=g;ctx.fillRect(0,0,2048,1024);
 let seed=108+variant;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(theme==='night')for(let i=0;i<260;i++){ctx.globalAlpha=.3+rnd()*.65;ctx.fillStyle='#eff7ff';ctx.beginPath();ctx.arc(rnd()*2048,rnd()*420,.7+rnd()*1.2,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;const sx=420+variant*61%850,sy=theme==='night'?230:350;
 const glow=ctx.createRadialGradient(sx,sy,4,sx,sy,150);glow.addColorStop(0,a.sun+'99');glow.addColorStop(1,a.sun+'00');ctx.fillStyle=glow;ctx.fillRect(sx-150,sy-150,300,300);ctx.fillStyle=a.sun;ctx.beginPath();ctx.arc(sx,sy,theme==='night'?16:25,0,Math.PI*2);ctx.fill();
 if(theme!=='night')for(let i=0;i<19;i++){const x=rnd()*2048,y=150+rnd()*240;ctx.globalAlpha=.12+rnd()*.12;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x,y,50+rnd()*100,5+rnd()*12,-.03,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;
 for(let layer=0;layer<3;layer++){ctx.fillStyle=[a.low+'55',a.low+'99',a.low][layer];ctx.beginPath();ctx.moveTo(0,700);for(let x=0;x<=2048;x+=8){const h=470+layer*23-Math.abs(Math.sin(x*.004+layer+variant))*(theme==='alpine'?90:42)-Math.sin(x*.015+layer)*13;ctx.lineTo(x,h);}ctx.lineTo(2048,1024);ctx.lineTo(0,1024);ctx.fill();}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;return texture;
}
