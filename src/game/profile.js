const KEY='slot08.profile.v2';
const costs=[100,180,280];
export class Profile {
  constructor(storage){this.storage=storage;this.data={unlocked:0,credits:0,upgrades:{motor:0,grip:0,brake:0},tutorial:false,medals:[0,0,0],records:{}};this.rewarded=new WeakSet();
    try{const d=JSON.parse(storage?.getItem(KEY)||'null');if(d){this.data.unlocked=Math.max(0,Math.min(2,Math.floor(Number(d.unlocked)||0)));this.data.credits=Math.max(0,Math.min(99999,Number(d.credits)||0));for(const k of Object.keys(this.data.upgrades))this.data.upgrades[k]=Math.max(0,Math.min(3,Math.floor(Number(d.upgrades?.[k])||0)));this.data.tutorial=d.tutorial===true;this.data.medals=this.data.medals.map((_,i)=>Math.max(0,Math.min(3,Number(d.medals?.[i])||0)));for(const [k,v]of Object.entries(d.records||{}))if(Number.isFinite(v)&&v>0)this.data.records[k]=v;}}catch{}}
  save(){try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
  price(key){return costs[this.data.upgrades[key]]??Infinity;}
  upgrade(key){if(!Object.hasOwn(this.data.upgrades,key)||this.data.credits<this.price(key))return false;this.data.credits-=this.price(key);this.data.upgrades[key]++;this.save();return true;}
  complete(session){if(session.status!=='finished'||session.mode!=='race'||this.rewarded.has(session.cars))return null;this.rewarded.add(session.cars);const rank=session.standings().findIndex(c=>!c.ai)+1,stars=rank===1?(session.player.crashes===0?3:2):1;const credits=80+(4-rank)*25+(session.player.crashes===0?25:0);this.data.credits+=credits;this.data.medals[session.level]=Math.max(stars,this.data.medals[session.level]);const before=this.data.unlocked;this.data.unlocked=Math.min(2,Math.max(before,session.level+1));this.save();return{credits,stars,rank,unlocked:this.data.unlocked>before};}
  record(key,time){if(Number.isFinite(time)&&time>0&&time<(this.data.records[key]??Infinity)){this.data.records[key]=time;this.save();return true;}return false;}
}
