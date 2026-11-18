import { RacingScore } from './score.js';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
function smooth(param,value,time,tau=.055){param.setTargetAtTime(value,time,tau);}
/** Opt-in local synthesis. Separate motor, tyre and coast layers are driven by
 * actual physics. The score ducks under skids; music and effects have own buses. */
export class SoundEngine {
  constructor(){this.enabled=false;this.context=null;this.voices=new Map();this.musicVolume=.45;this.effectsVolume=.75;this.lastCue=-10;this.active=false;}
  init(){
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;
    const c=this.context=new Context();this.master=c.createGain();this.master.gain.value=.75;
    const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.004;limiter.release.value=.15;
    this.master.connect(limiter).connect(c.destination);
    this.effects=c.createGain();this.effects.gain.value=this.effectsVolume;this.effects.connect(this.master);
    this.music=c.createGain();this.music.gain.value=0;this.music.connect(this.master);
    this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);let seed=808;
    for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=seed/2147483648-1;}
    this.score=new RacingScore(c,this.music,this.noise);return true;
  }
  async toggle(){try{if(!this.context&&!this.init())return false;if(this.enabled){this.enabled=false;await this.context.suspend();}else{await this.context.resume();this.enabled=this.context.state==='running';}}catch{this.enabled=false;}return this.enabled;}
  setVolumes({music=this.musicVolume,effects=this.effectsVolume}={}){this.musicVolume=clamp(music);this.effectsVolume=clamp(effects);}
  voice(id,pan){
    if(this.voices.has(id))return this.voices.get(id);
    const c=this.context,out=c.createStereoPanner();out.pan.value=pan;out.connect(this.effects);
    const oscillator=(type,filterType,frequency)=>{const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=type;f.type=filterType;f.frequency.value=frequency;g.gain.value=0;o.connect(f).connect(g).connect(out);o.start();return{o,f,g};};
    const noise=(frequency,q)=>{const o=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();o.buffer=this.noise;o.loop=true;f.type='bandpass';f.frequency.value=frequency;f.Q.value=q;g.gain.value=0;o.connect(f).connect(g).connect(out);o.start();return{o,f,g};};
    const v={engine:oscillator('sawtooth','lowpass',1500),sub:oscillator('triangle','lowpass',500),tyre:oscillator('triangle','bandpass',1900),rubber:noise(2200,.65),coast:noise(700,3),pan:out,wasBraking:false,wasState:'slotted'};
    this.voices.set(id,v);return v;
  }
  update(session,active){
    if(!this.context||!this.enabled)return;
    const now=this.context.currentTime,cars=session.cars??[session],player=session.player??session;
    smooth(this.effects.gain,this.effectsVolume,now);smooth(this.music.gain,active?this.musicVolume*.38*(player.skid>.3?.65:1):0,now,.15);
    this.score.update(active&&this.musicVolume>0,Math.min(1,player.speed/3.8));
    const present=new Set(),humans=cars.filter(c=>!c.ai).length;
    cars.forEach((car,i)=>{
      present.add(car.id);const v=this.voice(car.id,cars.length===1?0:(i-1)*.5);
      const running=active&&car.state==='slotted'&&car.finishedAt===null,speed=car.speed,load=car.throttle,skid=running?car.skid:0;
      const weight=car.ai?.24:humans>1?.62:1,rpm=55+speed*98+load*22;
      smooth(v.engine.o.frequency,rpm,now,.07);smooth(v.engine.f.frequency,550+speed*330+load*900,now);smooth(v.engine.g.gain,running?(.012+Math.min(1,speed)*.025+load*.022)*weight:0,now);
      smooth(v.sub.o.frequency,rpm/2,now);smooth(v.sub.g.gain,running?.025*weight:0,now);
      smooth(v.tyre.o.frequency,900+skid*850+Math.sin(now*32)*skid*70,now,.025);smooth(v.tyre.g.gain,skid*.045*weight,now,.025);smooth(v.rubber.g.gain,skid*.075*weight,now,.025);
      const braking=running&&load<.15&&speed>.35;smooth(v.coast.f.frequency,300+speed*210,now);smooth(v.coast.g.gain,braking?.05*weight:0,now);
      if(active&&this.active){if(braking&&!v.wasBraking&&!car.ai)this.chirp(530,145,.24,.025);if(car.state==='derailed'&&v.wasState!=='derailed')this.impact(weight);}
      v.wasBraking=braking;v.wasState=car.state;
    });
    for(const [id,v]of this.voices)if(!present.has(id))for(const part of ['engine','sub','tyre','rubber','coast'])smooth(v[part].g.gain,0,now);
    if(active&&session.guidanceEnabled&&player.coach?.action==='brake'&&player.throttle>.1&&now-this.lastCue>1.6){this.chirp(740,520,.15,.07);this.lastCue=now;}
    this.active=active;
  }
  chirp(from,to,duration=.16,volume=.045,delay=0){
    if(!this.context||!this.enabled)return;const c=this.context,now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(from,now);o.frequency.exponentialRampToValueAtTime(to,now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(this.effects);o.start(now);o.stop(now+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  impact(weight=1){const c=this.context,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;n.buffer=this.noise;f.type='lowpass';f.frequency.value=1100;g.gain.setValueAtTime(.16*weight,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);n.connect(f).connect(g).connect(this.effects);n.start(t);n.stop(t+.32);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();};this.chirp(120,40,.3,.07*weight);}
  beep(go=false){this.chirp(go?1047:698,go?1047:698,go?.24:.14,.08);}
  event(type){if(type==='switch')this.chirp(440,1320,.13,.055);if(type==='lap'){this.chirp(784,784,.13,.06);this.chirp(1047,1047,.19,.06,.13);}if(type==='finish')for(let i=0;i<4;i++)this.chirp([523,659,784,1047][i],[523,659,784,1047][i],.28,.07,i*.13);}
  destroy(){this.context?.close();this.voices.clear();}
}
