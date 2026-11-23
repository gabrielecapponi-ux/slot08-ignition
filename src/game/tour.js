import { SECTORS } from '../track/sectors.js';
export const WORLDS=[
 ['Scuola del bosco',[0,1,5,6,13]],['Riviera GT',[3,2,12,8,4]],['Terre rosse',[4,7,9,3,14]],
 ['Valichi alpini',[1,6,11,5,13]],['Banchine del porto',[2,8,10,12,3]],['Circuiti notturni',[10,8,2,9,14]],
 ['Costa endurance',[12,3,4,7,13]],['Coppa delle spirali',[5,9,11,6,14]],['Maestri del ponte',[6,8,10,12,11]],['Finali del club',[13,7,9,11,14]]
].map(([,levels],i)=>[SECTORS[i][0],[...levels,...levels.slice(2),...levels.slice(0,2)]]);
export const STAR_GATE=8;
export const FLEET=[
 // Existing chassis IDs are stable across saved garages.
 {name:'GT-08 Club',world:0,speed:1,drive:1,grip:1,type:'Coupé GT'},
 {name:'RS Touring',world:1,speed:1.09,drive:1.07,grip:1.02,type:'Turismo da circuito'},
 {name:'LM Prototipo',world:4,speed:1.18,drive:1.14,grip:1.04,type:'Sport prototipo'},
 {name:'Rally Treporte',world:2,speed:1.115,drive:1.095,grip:1.045,type:'Compatta rally'},
 {name:'Berlinetta S',world:6,speed:1.22,drive:1.19,grip:.975,type:'Berlinetta sportiva'},
 {name:'Endurance GT',world:3,speed:1.13,drive:1.10,grip:1.03,type:'Gran turismo endurance'},
 {name:'Targa R',world:5,speed:1.19,drive:1.17,grip:1.015,type:'Sport aperta'},
 {name:'Gruppo C 88',world:7,speed:1.24,drive:1.20,grip:1.05,type:'Prototipo a coda lunga'},
 {name:'Hypercar 09',world:9,speed:1.30,drive:1.23,grip:1.07,type:'Hypercar da competizione'}
];
// Retain the original course IDs so existing stars, records and garage unlocks survive.
export const raceId=(world,round)=>world*5+round%5+(round>=5?50:0);
export const MEETINGS=Array.from({length:100},(_,id)=>{
 const world=Math.floor(id%50/5),round=id%5+(id>=50?5:0),[name,levels]=WORLDS[world];
 return {name:name+' · '+(round+1),world,level:levels[round],round,difficulty:'club',rank:3,bonus:120+world*25+round*15};
});
export function worldStars(results,world){return WORLDS[world][1].reduce((sum,_,i)=>sum+(results[raceId(world,i)]||0),0);}
export function openWorld(results){
 let w=0;
 while(w<WORLDS.length-1 && worldStars(results,w)>=STAR_GATE)w++;
 return w;
}

export function nextCampaignRace(round, results) {
 const meeting = MEETINGS[round];
 if ((results[round] || 0) < 2) return round;
 if(meeting.round<9)return raceId(meeting.world,meeting.round+1);
 if(meeting.world===WORLDS.length-1)return null;
 if(worldStars(results,meeting.world)>=STAR_GATE)return raceId(meeting.world+1,0);
 const ids=WORLDS[meeting.world][1].map((_,i)=>raceId(meeting.world,i));
 return ids.reduce((a,b)=>(results[a]||0)<=(results[b]||0)?a:b);
}
