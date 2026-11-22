import { clamp, smootherstep } from '../core/math.js';

/** A deterministic terrain field. The complete road footprint stays level and clear,
 * including all decks of a crossing. Shared by terrain and prop placement. */
export function createLandscape(track) {
 const samples=Array.from({length:Math.ceil(track.length/.3)},(_,i)=>track.sample(i/Math.ceil(track.length/.3)*track.length));
 const bins=new Map(),cell=3;
 for(const p of samples){const key=Math.floor(p.x/cell)+','+Math.floor(p.y/cell);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);}
 const distance=(x,y)=>{let d=100;const bx=Math.floor(x/cell),by=Math.floor(y/cell);for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)for(const p of bins.get((bx+a)+','+(by+b))??[]){
    // Props and ground relief respect the actual split road, not only its old centreline.
    const spread=(p.fork?.offset||0)/2;
    if(spread>.001)for(const side of [-1,1])d=Math.min(d,(p.x+side*p.nx*spread-x)**2+(p.y+side*p.ny*spread-y)**2);
    else d=Math.min(d,(p.x-x)**2+(p.y-y)**2);
  }return Math.sqrt(d);};
 const seed=track.index*.83;
 const amplitude={forest:.85,alpine:1.6,harbor:.2,coast:.45,canyon:1.35,desert:.8,night:.55}[track.theme]??.7;
 const height=(x,y)=>{
  const clearance=smootherstep(clamp((distance(x,y)-1.15-(track.extraWidth??0))/2.5,0,1));
  const ridge=.32+.38*Math.sin(x*.31+seed)*Math.cos(y*.27-seed)+.2*Math.sin(x*.69+y*.33);
  return Math.max(0,ridge)*amplitude*clearance;
 };
 function* nearby(x,y){
  const bx=Math.floor(x/cell),by=Math.floor(y/cell);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)yield* bins.get((bx+a)+','+(by+b))??[];
 }
 return {samples,distance,height,nearby};
}
