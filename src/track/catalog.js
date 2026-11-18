import { SlotTrack } from './base.js';
import { FigureEight } from './figure-eight.js';
import { mod } from '../core/math.js';

export const LEVELS = Object.freeze([
  {id:'sunset',name:'Sunset Speedway',tag:'01 / IMPARA IL RITMO',subtitle:'Rettilinei lunghi. Il tuo primo podio.',color:'#ff733e',sky:'#e8c399',board:'#aa7651'},
  {id:'skyline',name:'Skyline Eight',tag:'02 / CONQUISTA IL PONTE',subtitle:'Due direzioni. Un incrocio sopra la città.',color:'#73d8dc',sky:'#adc7cc',board:'#47616b'},
  {id:'neon',name:'Neon Harbor',tag:'03 / TROVA IL LIMITE',subtitle:'Curve tecniche, banchine e luci elettriche.',color:'#b59bff',sky:'#333751',board:'#343c57'},
]);
export class OvalTrack extends SlotTrack {
  constructor(){super();this.radius=2.25;this.straightLength=9;this.length=18+2*Math.PI*this.radius;this.width=.70;this.switches=[0,9+Math.PI*this.radius].map((s,id)=>({id,start:s+.65,activationEnd:s+1.15,end:s+3.85}));}
  sample(distance){
    const s=mod(distance,this.length),L=this.straightLength,R=this.radius,A=Math.PI*R;
    let x,y,tx,ty,k=0,section;
    if(s<L){x=-L/2+s;y=-R;tx=1;ty=0;section=0;}
    else if(s<L+A){const a=-Math.PI/2+(s-L)/R;x=L/2+R*Math.cos(a);y=R*Math.sin(a);tx=-Math.sin(a);ty=Math.cos(a);k=1/R;section=1;}
    else if(s<2*L+A){x=L/2-(s-L-A);y=R;tx=-1;ty=0;section=2;}
    else{const a=Math.PI/2+(s-2*L-A)/R;x=-L/2+R*Math.cos(a);y=R*Math.sin(a);tx=-Math.sin(a);ty=Math.cos(a);k=1/R;section=3;}
    return{s,x,y,z:0,tx,ty,nx:-ty,ny:tx,curvature:k,bridge:false,section};
  }
}
/** Arc-length lookup is built once. Analytic Catmull-Rom derivatives provide
 * curvature; binary search and interpolation keep each simulation step cheap. */
export class HarborTrack extends SlotTrack {
  constructor(){
    super();this.width=.70;
    this.points=[[-3,-3],[2,-3],[6,-3],[8,-1],[7,3],[4,3],[2,1],[0,1],[-2,3],[-6,4],[-8,1],[-7,-3]];
    this.table=[];let length=0,prev=null;
    for(let i=0;i<=2400;i++){const t=i/2400*this.points.length,p=this.curve(t);if(prev)length+=Math.hypot(p.x-prev.x,p.y-prev.y);this.table.push({t,s:length});prev=p;}
    this.length=length;this.switches=[{id:0,start:.65,activationEnd:1.15,end:3.85}];
  }
  curve(t){
    const n=this.points.length,j=Math.floor(t),u=t-j,p=[-1,0,1,2].map(d=>this.points[mod(j+d,n)]),v=[],d=[],dd=[];
    for(let k=0;k<2;k++){const [a,b,c,e]=p.map(q=>q[k]),A=-a+3*b-3*c+e,B=2*a-5*b+4*c-e,C=-a+c;v[k]=.5*(2*b+C*u+B*u*u+A*u*u*u);d[k]=.5*(C+2*B*u+3*A*u*u);dd[k]=B+3*A*u;}
    const m=Math.hypot(...d);return{x:v[0],y:v[1],tx:d[0]/m,ty:d[1]/m,curvature:(d[0]*dd[1]-d[1]*dd[0])/m**3};
  }
  at(s){let lo=0,hi=this.table.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(this.table[m].s<=s)lo=m;else hi=m;}const a=this.table[lo],b=this.table[hi];return this.curve(a.t+(b.t-a.t)*(s-a.s)/(b.s-a.s));}
  sample(distance){const s=mod(distance,this.length),p=this.at(s);const z=s>15&&s<23?.42*Math.sin(Math.PI*(s-15)/8)**2:0;return{...p,s,z,nx:-p.ty,ny:p.tx,bridge:z>.05,section:0,curvatureDerivative:(this.at(mod(s+.01,this.length)).curvature-this.at(mod(s-.01,this.length)).curvature)/.02};}
}
export function createTrack(index=0){
  const track=index===0?new OvalTrack():index===1?new FigureEight({radius:2.2,halfSpacing:4.2,elevation:.62}):new HarborTrack();
  if(index===1)track.switches=[0,track.halfLength].map((s,id)=>({id,start:s+.65,activationEnd:s+1.15,end:s+3.85}));
  track.level=LEVELS[index];track.index=index;
  const pts=Array.from({length:500},(_,i)=>track.sample(i/500*track.length));
  track.bounds={minX:Math.min(...pts.map(p=>p.x))-1.1,maxX:Math.max(...pts.map(p=>p.x))+1.1,minY:Math.min(...pts.map(p=>p.y))-1.2,maxY:Math.max(...pts.map(p=>p.y))+1.2};
  return track;
}
