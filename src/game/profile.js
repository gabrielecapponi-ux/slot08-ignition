import { MEETINGS } from './club.js';
import { FLEET,openWorld } from './tour.js';
import { LEVELS } from '../track/catalog.js';
import { UPGRADE_LIMIT, UPGRADE_PRICES, PARTS, DEFAULT_APPEARANCE, sanitizeAppearance, partPrice } from './workshop.js';
const BACKUP='slot08.before-club14';
const cleanVehicle=()=>({upgrades:{motor:0,grip:0,brake:0},appearance:{...DEFAULT_APPEARANCE},owned:[],wins:0,tuning:'balanced'});
const KEY='slot08.profile.v2';
export class Profile {
 constructor(storage){this.storage=storage;this.data={results:Array(50).fill(0),car:0,clubWins:0,unlocked:0,credits:0,upgrades:{motor:0,grip:0,brake:0},appearance:{...DEFAULT_APPEARANCE},owned:[],tutorial:false,medals:Array(LEVELS.length).fill(0),records:{},season:0,vehicles:{},rivalRating:[0,0,0]};this.rewarded=new WeakSet();
  try{const d=JSON.parse(storage?.getItem(KEY)||'null');if(d){this.data.season=d.season===14?14:0;this.data.rivalRating=[0,1,2].map(i=>Math.max(-1,Math.min(2,Number(d.rivalRating?.[i])||0)));
    for(const [id,v] of Object.entries(d.vehicles||{})){if(!FLEET[id])continue;const clean=cleanVehicle();for(const k of Object.keys(clean.upgrades))clean.upgrades[k]=Math.max(0,Math.min(20,Math.floor(Number(v.upgrades?.[k])||0)));clean.appearance=sanitizeAppearance(v.appearance);clean.owned=Array.isArray(v.owned)?v.owned.filter(x=>/^(wing|wheels|hood|aero|lights|exhaust):([1-9]|10)$/.test(x)):[];clean.wins=Math.max(0,Math.floor(Number(v.wins)||0));clean.tuning=['balanced','sprint','endurance'].includes(v.tuning)?v.tuning:'balanced';this.data.vehicles[id]=clean;}
    this.data.clubWins=Number.isInteger(d.clubWins)?Math.max(0,Math.min(MEETINGS.length,d.clubWins)):0;if(Array.isArray(d.results)) this.data.results=this.data.results.map((_,i)=>Number.isInteger(d.results[i])?Math.max(0,Math.min(3,d.results[i])):0);
    else {const legacy=[0,1,6,11,25,49];for(let i=0;i<Math.min(6,this.data.clubWins);i++)this.data.results[legacy[i]]=Math.max(1,Math.min(3,Number(d.medals?.[[0,1,2,7,10,14][i]])||1));}
    this.data.clubWins=this.data.results.filter(Boolean).length;
    if(FLEET[d.car]?.world<=openWorld(this.data.results))this.data.car=Number(d.car);
    this.data.unlocked=Math.max(0,Math.min(LEVELS.length-1,Math.floor(Number(d.unlocked)||0)));this.data.credits=Math.max(0,Math.min(999999,Number(d.credits)||0));for(const k of Object.keys(this.data.upgrades))this.data.upgrades[k]=Math.max(0,Math.min(UPGRADE_LIMIT,Math.floor(Number(d.upgrades?.[k])||0)));this.data.appearance=sanitizeAppearance(d.appearance);this.data.owned=Array.isArray(d.owned)?d.owned.filter(k=>/^(wing|wheels|hood|aero|lights|exhaust):([1-9]|10)$/.test(k)):[];this.data.tutorial=d.tutorial===true;this.data.medals=this.data.medals.map((_,i)=>Math.max(0,Math.min(3,Number(d.medals?.[i])||0)));for(const [k,v]of Object.entries(d.records||{}))if(Number.isFinite(v)&&v>0)this.data.records[k]=v;}}catch{}
 }
 get vehicle(){return this.data.vehicles[this.data.car]??=cleanVehicle();}
 syncVehicle(){Object.assign(this.vehicle,{upgrades:{...this.data.upgrades},appearance:{...this.data.appearance},owned:[...this.data.owned]});}
 selectCar(id){if(!FLEET[id]||FLEET[id].world>openWorld(this.data.results))return false;this.syncVehicle();this.data.car=id;const v=this.vehicle;this.data.upgrades={...v.upgrades};this.data.appearance={...v.appearance};this.data.owned=[...v.owned];this.save();return true;}
 setTuning(value){if(this.data.upgrades.motor<20||!['balanced','sprint','endurance'].includes(value))return false;this.vehicle.tuning=value;this.save();return true;}
 beginNewArcadeOnce(){
  if(this.data.season===14)return false;
  const old=JSON.stringify(this.data),fresh=new Profile(null).data;fresh.season=14;
  try{if(this.storage){if(!this.storage.getItem(BACKUP))this.storage.setItem(BACKUP,old);this.storage.setItem(KEY,JSON.stringify(fresh));}this.data=fresh;return true;}catch{return false;}
 }
 get hasBackup(){try{return !!this.storage?.getItem(BACKUP);}catch{return false;}}
 restorePrevious(){try{const raw=this.storage?.getItem(BACKUP);if(!raw)return false;const restored=new Profile({getItem:()=>raw}).data;restored.season=14;this.storage.setItem('slot08.club14-current-backup',JSON.stringify(this.data));this.storage.setItem(KEY,JSON.stringify(restored));this.data=restored;return true;}catch{return false;}}
 save(){this.syncVehicle();try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
 price(key){return UPGRADE_PRICES[this.data.upgrades[key]]??Infinity;}
 upgrade(key){if(!Object.hasOwn(this.data.upgrades,key)||this.data.credits<this.price(key))return false;this.data.credits-=this.price(key);this.data.upgrades[key]++;this.save();return true;}
 owns(key,v){return v===0||this.data.owned.includes(key+':'+v);}
 equip(key,value){if(['paint','decal','glass','seat'].includes(key)){const a=sanitizeAppearance({...this.data.appearance,[key]:value});if(a[key]!==value)return false;this.data.appearance=a;this.save();return true;}
  if(!PARTS[key]||!Number.isInteger(value)||value<0||value>=PARTS[key].names.length)return false;
  if(!this.owns(key,value)){const price=partPrice(value);if(price>this.data.credits)return false;this.data.credits-=price;this.data.owned.push(key+':'+value);}
  this.data.appearance[key]=value;this.save();return true;
 }
 complete(session){if(session.status!=='finished'||!['race','grandprix','campaign','elimination'].includes(session.mode)||this.rewarded.has(session.cars))return null;this.rewarded.add(session.cars);const oldWorld=openWorld(this.data.results),oldStars=this.data.results[session.clubRound]||0;const rank=session.standings().indexOf(session.player)+1,stars=session.meeting?(rank<=session.meeting.rank?1+Number(rank<=2)+Number(rank===1||session.player.crashes===0):0):rank===1?(session.player.crashes===0?3:2):1;let credits=Math.round((80+(4-rank)*25+(session.player.crashes===0?25:0))*Math.min(2,Math.max(1,session.track.length/70)));const qualified=!!session.meeting && rank<=session.meeting.rank;
    if(qualified && session.meeting.world<=openWorld(this.data.results)){
      const index=session.clubRound,previous=this.data.results[index];
      if(!previous){credits+=session.meeting.bonus;this.data.clubWins++;}
      this.data.results[index]=Math.max(previous,stars);
    }
    if(rank===1)this.vehicle.wins++;if(session.meeting)this.data.rivalRating=this.data.rivalRating.map((v,i)=>Math.max(-1,Math.min(2,v+(rank===1?.22:rank>=3?-.12:0)*(1-i*.12))));this.data.credits+=credits;this.data.medals[session.level]=Math.max(stars,this.data.medals[session.level]);const before=this.data.unlocked;this.data.unlocked=Math.min(LEVELS.length-1,Math.max(before,session.level+1));this.save();return{qualified,credits,stars,rank,unlocked:this.data.unlocked>before,newWorld:openWorld(this.data.results)>oldWorld,gainedStars:Math.max(0,(this.data.results[session.clubRound]||0)-oldStars),unlockedCars:FLEET.filter(c=>c.world>oldWorld&&c.world<=openWorld(this.data.results)).map(c=>c.name)};}
 record(key,time){if(Number.isFinite(time)&&time>0&&time<(this.data.records[key]??Infinity)){this.data.records[key]=time;this.save();return true;}return false;}
}
