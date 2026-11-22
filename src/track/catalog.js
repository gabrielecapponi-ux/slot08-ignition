import { championshipBase, installFork, courseName, courseFeature } from './championship.js';
import { ScenicTrack, SpiralTrack } from './scenic.js';
import { EnduranceTrack, ENDURANCE_LAYOUTS } from './endurance.js';
import { SlotTrack } from './base.js';
import { FigureEight } from './figure-eight.js';
import { courseConditions } from './conditions.js';
import { mod } from '../core/math.js';

const BASE_LEVELS = Object.freeze([
  {id:'sunset',name:'Sunset Speedway',tag:'01 / IMPARA IL RITMO',subtitle:'Rettilinei lunghi. Il tuo primo podio.',color:'#ff733e',sky:'#e8c399',board:'#aa7651'},
  {id:'skyline',name:'Skyline Eight',tag:'02 / CONQUISTA IL PONTE',subtitle:'Due direzioni. Un incrocio sopra la città.',color:'#73d8dc',sky:'#adc7cc',board:'#47616b'},
  {id:'neon',name:'Neon Harbor',tag:'03 / TROVA IL LIMITE',subtitle:'Curve tecniche, banchine e luci elettriche.',color:'#b59bff',sky:'#333751',board:'#343c57'},
  {id:'coast',name:'Coast Run',tag:'04 / IL PRIMO ALLUNGO',subtitle:'27 metri di rettilineo. Impara il punto di frenata.',color:'#f9b969',sky:'#dec9a1',board:'#dec9a1'},
  {id:'canyon',name:'Canyon Switch',tag:'05 / CAMBIA RITMO',subtitle:'Una L, curve opposte e due grandi allunghi.',color:'#f79067',sky:'#c8a28b',board:'#c8a28b'},
  {id:'airstrip',name:'Airstrip XL',tag:'06 / APRI TUTTO',subtitle:'33 metri di gas, tornanti e un tratto rialzato.',color:'#8de5e0',sky:'#bdcecf',board:'#bdcecf'},
  {id:'serpent',name:'Serpent Valley',tag:'07 / DOMA LE ESSE',subtitle:'Rettifilo, controcurve e staccate da ricordare.',color:'#b8d978',sky:'#bfc9a5',board:'#bfc9a5'},
  {id:'salt',name:'Salt Flats',tag:'08 / VELOCITÀ PURA',subtitle:'Il deserto, un rettilineo di 37 metri e curve veloci.',color:'#ffdb9a',sky:'#e6d5b8',board:'#e6d5b8'},
  {id:'viaduct',name:'Viaduct Rush',tag:'09 / SU E GIÙ',subtitle:'Sei curve, un dosso e molto spazio per sorpassare.',color:'#8dd6eb',sky:'#b4c4cd',board:'#b4c4cd'},
  {id:'switchback',name:'Switchback GP',tag:'10 / LA SFIDA TECNICA',subtitle:'48 metri tra le estremità. Impara tre staccate diverse.',color:'#e1a0ff',sky:'#b6adc9',board:'#b6adc9'},
  {id:'night',name:'Night Express',tag:'11 / NELLA NOTTE',subtitle:'La pista si allunga. Luci fredde e chicane.',color:'#8be2d5',sky:'#263548',board:'#263548'},
  {id:'alpine',name:'Alpine Marathon',tag:'12 / RESISTENZA',subtitle:'Rettifilo da 50 metri, alture e controcurve.',color:'#d7eff5',sky:'#c7d6d8',board:'#c7d6d8'},
  {id:'dock',name:'Docklands GP',tag:'13 / PRECISIONE',subtitle:'Curve diagonali e un settore tecnico dopo il rettilineo.',color:'#ff9d71',sky:'#bba39a',board:'#bba39a'},
  {id:'grand',name:'Grand Tour',tag:'14 / IL GRANDE GIRO',subtitle:'Oltre 170 metri di pista, tre lunghi giri.',color:'#c6f568',sky:'#a8baaa',board:'#a8baaa'},
  {id:'endless',name:'Endless Summit',tag:'15 / LA FINALE',subtitle:'Il circuito più lungo: 62 metri di gas e dieci curve.',color:'#e7b2ff',sky:'#373149',board:'#373149'},
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
const WORLDS=[
  ['forest','Bosco delle Volpi','Tra pini, animali e una galleria di pietra.',.12],
  ['alpine','Passo dei Cervi','Due rami incrociati, ponte alto e galleria.',.23],
  ['harbor','Porto delle Lanterne','Banchine, fari e curve sul lungomare.',.16],
  ['coast','Palm Coast','Un lungo allungo tra palme e case sul mare.',.24],
  ['canyon','Red Rock Canyon','Mesas, galleria nel canyon e curve opposte.',.29],
  ['forest','Spirale del Bosco','Una vera spirale sopraelevata tra gli alberi.',.48],
  ['alpine','Alpine Crossing','Doppio senso di curva, incrocio a due quote.',.28],
  ['desert','Dune Paraboliche','Curve inclinate e un rettilineo nel deserto.',.53],
  ['harbor','Harbor Flyover','Un cavalcavia attraversa il porto illuminato.',.30],
  ['canyon','Copper Spiral','Un giro elicoidale fra pareti di roccia.',.46],
  ['night','Neon Junction','Ponte incrociato, gallerie e insegne notturne.',.35],
  ['alpine','Glacier Summit','Rampe, tunnel e rifugi nel paesaggio alpino.',.38],
  ['coast','Coastal Switchback','Doppio tracciato incrociato lungo la costa.',.28],
  ['forest','Grand Forest Tour','Il grande circuito tra mulini e villaggi.',.31],
  ['night','Double Helix','Due giri di spirale, 5,2 metri di dislivello.',.52],
];
export const LEVELS=Object.freeze(BASE_LEVELS.map((l,i)=>Object.freeze({...l,name:WORLDS[i][1],subtitle:WORLDS[i][2],tag:String(i+1).padStart(2,'0')+' / '+(['forest','alpine'].includes(WORLDS[i][0])?'NATURA IN MINIATURA':'MONDO DA ESPLORARE')})));
export function createTrack(index=0,{lanes=2,variant=-1}={}){
  index=Math.max(0,Math.min(LEVELS.length-1,Math.floor(Number(index)||0)));
  let base;
  if(Number.isInteger(variant)&&variant>=0&&variant<50)base=championshipBase(variant);
  else if(index===0){base=new OvalTrack();}
  else if([1,6,8,10,12].includes(index)){
    const size={1:[2.8,6],6:[3,10],8:[3,13],10:[3,15],12:[3,17]}[index];
    base=new FigureEight({radius:size[0],halfSpacing:size[1],elevation:1.65});
    base.switches=[0,base.halfLength].map((s,id)=>({id,start:s+.65,activationEnd:s+1.15,end:s+3.85}));
  }else if([5,9,14].includes(index))base=new SpiralTrack(index===14?{radius:4,turns:2,width:22,height:9,lift:5.2}:index===9?{radius:3.6,width:17,height:8,lift:2.6}:{radius:3.2,width:11,height:6,lift:2.2});
  else if(index===2)base=new EnduranceTrack({points:[[-10,-6],[10,-6],[10,6],[2,6],[2,0],[-10,0]],radius:2.2});
  else base=new EnduranceTrack(ENDURANCE_LAYOUTS[index-3]);
  const [theme,name,subtitle,bank]=WORLDS[index];
  const track=new ScenicTrack(base,{theme,bank,tunnelCount:index<3?1:2,feature:subtitle});
  track.laneCount=lanes===4?4:2;track.width=.70+2*track.extraWidth;if(track.laneCount===4)track.maxBank=Math.min(bank,.28);
  track.level={...LEVELS[index],name,subtitle};track.index=index;track.variant=variant;
  if(variant>=0){track.level={...track.level,name:courseName(variant),subtitle:courseFeature(variant)};if(variant%5===4&&lanes===4)installFork(track);}
  const pts=Array.from({length:1000},(_,i)=>track.sample(i/1000*track.length));
  track.bounds={minX:Math.min(...pts.map(p=>p.x))-2,maxX:Math.max(...pts.map(p=>p.x))+2,minY:Math.min(...pts.map(p=>p.y))-2,maxY:Math.max(...pts.map(p=>p.y))+2};
  track.maxElevation=Math.max(...pts.map(p=>p.z));track.conditions=courseConditions(track);return track;
}
export const WORLD_NAMES=WORLDS.map(w=>w[1]);
