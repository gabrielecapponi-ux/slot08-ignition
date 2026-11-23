import { clamp, mod } from '../core/math.js';

import { WEATHER } from './weather.js';

const TYPES={
 rubber:{label:'TRAIETTORIA GOMMATA',short:'Gomma depositata',grip:1.13,color:'#3f4044'},
 grit:{label:'GRANIGLIA IN CORSIA',short:'Graniglia',grip:.76,color:'#b6ab96'},
 leaves:{label:'FOGLIE SULLA PISTA',short:'Foglie',grip:.79,color:'#a77b38'},
 dust:{label:'POLVERE IN CURVA',short:'Polvere',grip:.82,color:'#c7aa7b'},
 damp:{label:'TRATTO UMIDO',short:'Umidità',grip:.76,color:'#709ca5'}
};
/** Visible, fixed surface hazards: never spawn underneath a car. */
export function courseConditions(track){
 const type=['forest','alpine'].includes(track.theme)?'leaves':['coast','harbor','night'].includes(track.theme)?'damp':'dust';
 const zones=[];
 for(const fraction of track.index>5?[.42,.73]:[.46]){
  let best=null;
  for(let s=track.length*fraction;s<Math.min(track.length*.92,track.length*(fraction+.25));s+=.25){
   const p=track.sample(s),length=1.8;
   if(Math.abs(p.curvature)<.10||p.z>.16||track.tunnelAt?.(s,2)||track.switches.some(g=>s>g.start-2&&s<g.end+2))continue;
   if(!best||Math.abs(p.curvature)>best.curve)best={start:s,length,curve:Math.abs(p.curvature)};
  }
  const surface=track.variant>=0&&track.variant%3!==0?(track.variant%3===1?'rubber':'grit'):type;
  if(best&&!zones.some(z=>Math.abs(z.start-best.start)<4))zones.push({...TYPES[surface],...best,type:surface,lane:(track.index+zones.length)%(track.laneCount??2)});
 }
 return zones;
}
export function surfaceAt(track,distance,lane){
 for(const zone of track.conditions??[]){
  const d=mod(distance-zone.start,track.length);
  if((lane==null||zone.lane===lane)&&d<=zone.length){
   const blend=clamp(Math.min(d,zone.length-d)/.3,0,1);
   return {...zone,grip:1-(1-zone.grip)*blend};
  }
 }
 return null;
}
export function surfaceGrip(track,distance,lane,setup){
 const surface=surfaceAt(track,distance,lane);
 const climate=WEATHER[track.weather]?.grip??1;
 const ambient=track.weather==='rain'&&track.tunnelAt?.(distance)?1:climate;
 return ambient*(surface?1-(1-surface.grip)*(setup?.surfaceSensitivity??1):1);
}
export function upcomingSurface(track,car){
 let nearest=null;
 for(const zone of track.conditions??[]){
  const inside=mod(car.distance-zone.start,track.length)<=zone.length;
  const distance=inside?0:mod(zone.start-car.distance,track.length);
  if(distance<Math.max(4,car.speed*2.3)&&(!nearest||distance<nearest.distance))nearest={...zone,distance,inside,affected:car.change!=null||car.lane===zone.lane};
 }
 return nearest;
}
