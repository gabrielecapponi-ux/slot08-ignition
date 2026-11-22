import { EnduranceTrack } from './endurance.js';
import { FigureEight } from './figure-eight.js';
import { SpiralTrack } from './scenic.js';

export const CHAPTERS=[
 ['La prima tessera','Il club apre le porte. Conosci la GT, trova il ritmo e conquista il primo trofeo.'],
 ['La sfida della riviera','Il mare è vicino. Apex ha preparato una turismo: rispondi con una traiettoria pulita.'],
 ['Polvere e rame','Le rocce nascondono tornanti e controcurve. Guarda oltre il prossimo scambio.'],
 ['Quota mille','Il club sale in montagna. Ponti e spirali cambiano il modo di leggere il circuito.'],
 ['Il turno del porto','Sotto i fari delle banchine, Volt porta in griglia il suo nuovo prototipo.'],
 ['Dopo mezzanotte','Le insegne si accendono. La notte premia chi ricorda ogni punto di frenata.'],
 ['La lunga costa','La squadra ha imparato a vincere. Ora servono continuità e una seconda auto pronta.'],
 ['Il vortice','Salite, discese e binari sospesi. La gravità è parte del circuito.'],
 ['Quattro rivali, un ponte','Ogni scambio conta. Scegli il ramo prima del bivio e difendi la tua corsia.'],
 ['L’ultima tessera','Il club ti conosce. Cinque finali, una coppa e una scuderia da completare.']
];
import { stuntBase } from './stunts.js';
const EXTREME={
 0:['Ion Slalom','Loop verticale e doppia esse',1,1.28],2:['Prisma Hairpin','Gomiti alternati e chicane stretta',0,1.05],
 3:['Vortice Zero','Spirale parabolica a due rotazioni',-1,2.7],5:['Orbita Gemella','Due loop e una esse in uscita',2,1.45],
 7:['Riviera Inversa','Dosso con backflip magnetico e tre tornanti',0,1.32],8:['Spirale Radente','Elica a due piani',-1,3.1]
};
const PLACES=['Foxwood','Riviera','Copper','Alpine','Docklands','Neon','Targa','Vortex','Skybridge','Crown'];
const FORMS=['Club Sprint','Crossover','Chicane GP','Spiral Run','Twin Route'];
export function courseRevision(id){if(EXTREME[id])return 17;return id>=10&&[0,2,4].includes(id%5)?16:14;}
export function courseName(id){if(EXTREME[id])return EXTREME[id][0];const name=courseRevision(id)===16?({0:'Sector Rally',2:'Switchback GP',4:'Split Chicane'}[id%5]):FORMS[id%5];return PLACES[Math.floor(id/5)]+' · '+name;}
export function courseFeature(id){if(EXTREME[id])return EXTREME[id][1];if(courseRevision(id)===16)return {0:'Tre settori, controcurve e dosso raccordato',2:'Doppia chicane e tornanti di raggio diverso',4:'Bivio per coppie di corsie e chicane in rientro'}[id%5];return ['Allungo e curve raccordate','Incrocio su due quote','Chicane e controcurve','Elica sopraelevata · '+(Math.floor(id/5)%2?'discesa':'salita'),'Due rami separati che si ricongiungono'][id%5];}
export function championshipBase(id){
 const world=Math.floor(id/5),form=id%5,w=9+world*.8,h=4.2+world*.19,r=2.05+world*.065;
 const extreme=EXTREME[id];
 if(extreme){
   const [,,loops,radius]=extreme;
   if(loops<0)return new SpiralTrack({radius,width:13+world*2,height:7,lift:3.3,turns:2});
   const points=[[-18,-8],[18,-8],[18,7],[10,7],[10,-1],[5,-1],[5,6],[0,6],[0,1],[-5,1],[-5,8],[-18,8]];
   if(id===2||id===7)points[5]=[6,-3];
   return stuntBase({points,radius:1.2+world*.15,turnRadius:radius,loops,flip:id===7});
 }
 let base;
 if(form===0)base=new EnduranceTrack({points:[[-w,-h],[w,-h],[w+.5*world,h*.2],[w*.52,h],[-w*.62,h+world*.1],[-w,h*.22]],radius:r});
 if(form===1){base=new FigureEight({radius:2.8+world*.09,halfSpacing:6.2+world*.6,elevation:1.8+world*.07});base.switches=[0,base.halfLength].map((s,id)=>({id,start:s+.65,activationEnd:s+1.15,end:s+3.85}));}
 if(form===2)base=new EnduranceTrack({points:[[-w-4,-h-3],[w+4,-h-3],[w+4,h+3],[3.2,h+3],[3.2,.2],[-3.2,.2],[-3.2,h+3],[-w-4,h+3]],radius:2.1+world*.045});
 if(form===3){base=new SpiralTrack({radius:3.3+world*.09,width:12+world*.7,height:7+world*.17,lift:2.4+world*.13,turns:world>6?2:1});if(world%2){const sample=base.sample.bind(base);base.sample=s=>{const p=sample(s);return {...p,z:base.lift-p.z,bridge:base.lift-p.z>.1};};}}
 if(form===4)base=new EnduranceTrack({points:[[-w-5,-h],[w+5,-h],[w+5,h+2],[w*.2,h+2],[-w*.15,h*.5],[-w-5,h+2]],radius:r,elevation:0});
 if(courseRevision(id)===16){
  const shapes={
   0:[[-20,-12],[20,-12],[20,12],[10,12],[10,4],[2,4],[2,12],[-8,12],[-8,2],[-20,2]],
   2:[[-22,-13],[22,-13],[22,13],[12,13],[12,4],[4,4],[4,13],[-5,13],[-5,-3],[-13,-3],[-13,13],[-22,13]],
   4:[[-21,-10],[21,-10],[21,10],[10,10],[10,3],[2,3],[2,10],[-8,10],[-8,3],[-21,3]]
  };
  const scale=.79+world*.035,points=shapes[form].map(([x,y])=>[x*scale,y*scale]);
  const radii=points.map((_,i)=>(i%3===0?2.65:i%3===1?2.25:2.05)*scale);
  base=new EnduranceTrack({points,radius:radii,elevation:form===0?.55+world*.04:form===4?.8+world*.055:0});
 }
 return base;
}
/** A smooth two-branch module on a straight. Each pair keeps its slot identity. */
export function installFork(track){
 const line=track.segments?.find(s=>s.type==='line'&&s.length>=16);
 if(!line)return;
 const start=line.start+4.4,end=line.start+line.length-.6,length=end-start;
 if(length<10)return;
 track.fork={start,end,length,gap:1.5};
 track.switches=track.switches.filter(g=>g.end<start||g.start>end);
 // No lane-change gate inside the separated section.
 track.switches.forEach((g,i)=>g.id=i);
 track.tunnels=track.tunnels.filter(t=>t.end<start||t.start>end);
}
