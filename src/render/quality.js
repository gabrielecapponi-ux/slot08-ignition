export const GRAPHICS_PROFILES=Object.freeze({
 mobile60:{name:'Mobile QHD',fps:60,adaptive:true,pixels:3686400,mobilePixels:3686400,dpr:4,shadow:1024,mobileShadow:768,probe:128,anisotropy:8},
 auto:{name:'Adattiva',fps:120,adaptive:true,pixels:5_000_000,mobilePixels:3_200_000,dpr:2.5,shadow:1536,mobileShadow:1024,probe:256,anisotropy:8},
 performance:{name:'Fluidità',fps:120,adaptive:true,pixels:2_600_000,mobilePixels:1_800_000,dpr:2,shadow:1024,mobileShadow:512,probe:128,anisotropy:4},
 quality:{name:'Dettaglio',fps:60,adaptive:true,pixels:8_294_400,mobilePixels:4_200_000,dpr:3,shadow:2048,mobileShadow:1536,probe:256,anisotropy:16},
 ultra:{name:'4K / 120',fps:120,adaptive:false,pixels:8_294_400,mobilePixels:8_294_400,dpr:4,shadow:2048,mobileShadow:1536,probe:512,anisotropy:16}
});
export function profileFor(id){return GRAPHICS_PROFILES[id]??GRAPHICS_PROFILES.auto;}
export function renderSize({width,height,dpr=1,mobile=false,profile='auto',scale=1,maxSize=8192}){
 const p=profileFor(profile),budget=mobile?p.mobilePixels:p.pixels;
 if(!(width>0&&height>0))return {width:1,height:1,ratio:1};
 const native=profile==='mobile60'?2560/Math.max(width,height):p===GRAPHICS_PROFILES.ultra?3840/Math.max(width,height):Math.min(dpr,p.dpr);
 const maximum=Math.min(native,Math.sqrt(budget/(width*height)),maxSize/Math.max(width,height));
 const ratio=maximum*Math.max(.55,Math.min(1,scale));
 return {width:Math.max(1,Math.floor(width*ratio)),height:Math.max(1,Math.floor(height*ratio)),ratio};
}
export class QualityGovernor{
 constructor(profile='auto'){this.setProfile(profile);}
 setProfile(profile){this.id=GRAPHICS_PROFILES[profile]?profile:'auto';this.profile=profileFor(this.id);this.scale=1;this.reset();}
 reset(){this.seconds=0;this.frames=0;this.cost=0;this.goodWindows=0;this.cadence=[];this.samples=0;this.observedHz=60;}
 sample(dt,costMs){
  if(!(dt>0&&dt<.5))return false;
  this.cadence.push(dt);if(this.cadence.length>180)this.cadence.shift();
  if(this.cadence.length>=30&&++this.samples%30===0){const sorted=[...this.cadence].sort((a,b)=>a-b),fast=sorted[Math.floor(sorted.length*.10)];this.observedHz=fast<.00915?120:fast<.01055?100:fast<.014?90:60;}
  this.seconds+=dt;this.frames++;this.cost+=costMs;
  // React to sustained misses in the mobile 60 fps preset before spending seconds at full resolution.
  const slowMobile=this.id==='mobile60'&&this.frames>=8&&this.seconds/this.frames>1/45;
  if(this.seconds<(slowMobile?.75:3))return false;
  this.fps=this.frames/this.seconds;this.renderMs=this.cost/this.frames;
  const target=Math.min(this.profile.fps,this.observedHz),budget=1000/target,old=this.scale;
  if(this.profile.adaptive){
   if(this.fps<target*.82||this.renderMs>budget*.88){this.scale=Math.max(.55,this.scale-.12);this.goodWindows=0;}
   else if(this.fps>target*.95&&this.renderMs<budget*.55){if(++this.goodWindows>=3){this.scale=Math.min(1,this.scale+.04);this.goodWindows=0;}}
   else this.goodWindows=0;
  }
  this.seconds=0;this.frames=0;this.cost=0;return Math.abs(old-this.scale)>.001;
 }
}
