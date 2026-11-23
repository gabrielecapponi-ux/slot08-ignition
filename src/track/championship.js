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
export {championshipBase,courseFeature,courseName,courseRevision} from './arcade-layouts.js';
/** A smooth two-branch module on a straight. Each pair keeps its slot identity. */
export function installFork(track){
 const line=track.segments?.find(s=>s.type==='line'&&s.length>=16);
 if(!line)return;
 const start=line.start+(track.base?.jump?17:4.4),end=line.start+line.length-.6,length=end-start;
 if(length<10)return;
 track.fork={start,end,length,gap:1.5};
 track.switches=track.switches.filter(g=>g.end<start||g.start>end);
 // No lane-change gate inside the separated section.
 track.switches.forEach((g,i)=>g.id=i);
 track.tunnels=track.tunnels.filter(t=>t.end<start||t.start>end);
}
