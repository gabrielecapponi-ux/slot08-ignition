import {icon} from './icons.js';
import {profileFor,GRAPHICS_PROFILES} from '../render/quality.js';
export function installGraphics({renderer,storage,pause,signal}){
 const get=id=>document.getElementById(id),dialog=get('graphics-panel'),select=get('graphics-profile');
 get('graphics-open').innerHTML=icon('optics');get('graphics-open').title='Grafica e prestazioni';
 let selected=window.matchMedia('(pointer:coarse), (max-width:650px)').matches?'race60':'performance';try{const saved=storage?.getItem('slot08-graphics');if(GRAPHICS_PROFILES[saved])selected=saved;}catch{}
 const supported=typeof renderer.setQuality==='function';select.value=selected;select.disabled=!supported;
 renderer.setQuality?.(selected);
 get('graphics-open').addEventListener('click',()=>{pause();dialog.showModal();},{signal});
 get('graphics-close').addEventListener('click',()=>dialog.close(),{signal});
 select.addEventListener('change',()=>{selected=select.value;renderer.setQuality?.(selected);try{storage?.setItem('slot08-graphics',selected);}catch{}},{signal});
 let last=-1;
 return {get fps(){return profileFor(selected).fps;},update(now){
  if(now-last<.5)return;last=now;
  const stats=renderer.stats?.()??{};
  if(!supported){get('graphics-live').textContent='Renderer di compatibilità · 3D non disponibile in questo browser';return;}
  const fps=Number.isFinite(stats.fps)&&stats.fps>0?Math.round(stats.fps)+' fps':'Misurazione in corso';
  get('graphics-live').textContent=`${stats.width??0} × ${stats.height??0} · ${fps} · ${renderer.kind.toUpperCase()}`;
  get('graphics-detail').textContent=selected==='ultra'?'Rendering fino a 3840 px sul lato lungo. Frequenza effettiva limitata da schermo e dispositivo.':`Obiettivo fino a ${profileFor(selected).fps} fps · risoluzione adattiva ${Math.round((stats.scale??1)*100)}%`;
  const node=get('scene-status');node.dataset.fps=(stats.fps||0).toFixed(1);node.dataset.drawCalls=stats.calls;node.dataset.triangles=stats.triangles;node.dataset.resolution=`${stats.width}x${stats.height}`;
 }};
}
