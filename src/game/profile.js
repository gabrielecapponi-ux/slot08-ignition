import { LEVELS } from '../track/catalog.js';
import { UPGRADE_LIMIT, UPGRADE_PRICES, PARTS, DEFAULT_APPEARANCE, sanitizeAppearance, partPrice } from './workshop.js';
const KEY='slot08.profile.v2';
export class Profile {
 constructor(storage){this.storage=storage;this.data={unlocked:0,credits:0,upgrades:{motor:0,grip:0,brake:0},appearance:{...DEFAULT_APPEARANCE},owned:[],tutorial:false,medals:Array(LEVELS.length).fill(0),records:{}};this.rewarded=new WeakSet();
  try{const d=JSON.parse(storage?.getItem(KEY)||'null');if(d){this.data.unlocked=Math.max(0,Math.min(LEVELS.length-1,Math.floor(Number(d.unlocked)||0)));this.data.credits=Math.max(0,Math.min(999999,Number(d.credits)||0));for(const k of Object.keys(this.data.upgrades))this.data.upgrades[k]=Math.max(0,Math.min(UPGRADE_LIMIT,Math.floor(Number(d.upgrades?.[k])||0)));this.data.appearance=sanitizeAppearance(d.appearance);this.data.owned=Array.isArray(d.owned)?d.owned.filter(k=>/^(wing|wheels|hood|aero|lights|exhaust):([1-9]|10)$/.test(k)):[];this.data.tutorial=d.tutorial===true;this.data.medals=this.data.medals.map((_,i)=>Math.max(0,Math.min(3,Number(d.medals?.[i])||0)));for(const [k,v]of Object.entries(d.records||{}))if(Number.isFinite(v)&&v>0)this.data.records[k]=v;}}catch{}
 }
 save(){try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
 price(key){return UPGRADE_PRICES[this.data.upgrades[key]]??Infinity;}
 upgrade(key){if(!Object.hasOwn(this.data.upgrades,key)||this.data.credits<this.price(key))return false;this.data.credits-=this.price(key);this.data.upgrades[key]++;this.save();return true;}
 owns(key,v){return v===0||this.data.owned.includes(key+':'+v);}
 equip(key,value){if(key==='paint'||key==='decal'){const a=sanitizeAppearance({...this.data.appearance,[key]:value});if(a[key]!==value)return false;this.data.appearance=a;this.save();return true;}
  if(!PARTS[key]||!Number.isInteger(value)||value<0||value>=PARTS[key].names.length)return false;
  if(!this.owns(key,value)){const price=partPrice(value);if(price>this.data.credits)return false;this.data.credits-=price;this.data.owned.push(key+':'+value);}
  this.data.appearance[key]=value;this.save();return true;
 }
 complete(session){if(session.status!=='finished'||session.mode!=='race'||this.rewarded.has(session.cars))return null;this.rewarded.add(session.cars);const rank=session.standings().indexOf(session.player)+1,stars=rank===1?(session.player.crashes===0?3:2):1;const credits=Math.round((80+(4-rank)*25+(session.player.crashes===0?25:0))*Math.min(2,Math.max(1,session.track.length/70)));this.data.credits+=credits;this.data.medals[session.level]=Math.max(stars,this.data.medals[session.level]);const before=this.data.unlocked;this.data.unlocked=Math.min(LEVELS.length-1,Math.max(before,session.level+1));this.save();return{credits,stars,rank,unlocked:this.data.unlocked>before};}
 record(key,time){if(Number.isFinite(time)&&time>0&&time<(this.data.records[key]??Infinity)){this.data.records[key]=time;this.save();return true;}return false;}
}
