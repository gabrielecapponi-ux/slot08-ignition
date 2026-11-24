import { RacingScore, raceSection } from './score.js';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const targets=new WeakMap();
function smooth(param,value,time,tau=.055){
 if(targets.get(param)===value)return;
 targets.set(param,value);param.setTargetAtTime(value,time,tau);
}
/** Opt-in local synthesis. Separate motor, tyre and coast layers are driven by
 * actual physics. The score ducks under skids; music and effects have own buses. */
export class SoundEngine {
  constructor(){this.enabled=false;this.context=null;this.voices=new Map();this.section='groove';this.musicVolume=.45;this.effectsVolume=.75;this.lastCue=-10;this.active=false;}
  init(){
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;
    const c=this.context=new Context({latencyHint:'interactive'});this.master=c.createGain();this.master.gain.value=.75;
    const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.004;limiter.release.value=.15;
    this.master.connect(limiter).connect(c.destination);
    this.effects=c.createGain();this.effects.gain.value=this.effectsVolume;this.effects.connect(this.master);
    this.music=c.createGain();this.music.gain.value=0;this.music.connect(this.master);
    this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);let seed=808;
    for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=seed/2147483648-1;}
    this.score=new RacingScore(c,this.music,this.noise);return true;
  }
  async toggle(){try{if(!this.context&&!this.init())return false;if(this.enabled){this.active=false;this.enabled=false;await this.context.suspend();}else{await this.context.resume();this.enabled=this.context.state==='running';}}catch{this.enabled=false;}return this.enabled;}
  setVolumes({music=this.musicVolume,effects=this.effectsVolume}={}){this.musicVolume=clamp(music);this.effectsVolume=clamp(effects);}
  voice(id,pan){
    if(this.voices.has(id))return this.voices.get(id);
    const c=this.context,out=c.createStereoPanner();out.pan.value=pan;out.connect(this.effects);
    const reflection = c.createDelay(.1), tone = c.createBiquadFilter(), tunnel = c.createGain();
    reflection.delayTime.value = .042;
    tone.type = 'lowpass'; tone.frequency.value = 1650; tunnel.gain.value = 0;
    out.connect(reflection).connect(tone).connect(tunnel).connect(this.effects);
    const oscillator=(type,filterType,frequency)=>{const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type=type;f.type=filterType;f.frequency.value=frequency;g.gain.value=0;o.connect(f).connect(g).connect(out);o.start();return{o,f,g};};
    const noise=(frequency,q)=>{const o=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();o.buffer=this.noise;o.loop=true;f.type='bandpass';f.frequency.value=frequency;f.Q.value=q;g.gain.value=0;o.connect(f).connect(g).connect(out);o.start();return{o,f,g};};
    const v={engine:oscillator('sawtooth','lowpass',1500),sub:oscillator('triangle','lowpass',500),gear:oscillator('triangle','bandpass',1000),rail:noise(850,1.1),tyre:oscillator('triangle','bandpass',1900),rubber:noise(2200,.65),coast:noise(700,3),pan:out,tunnel,releaseArmed:false,previousSpeed:0,updatedAt:null,wasState:'slotted'};
    this.voices.set(id,v);return v;
  }
  update(session,active){
    if(!this.context||!this.enabled)return;
    const now=this.context.currentTime,cars=session.cars??[session],player=session.player??session;
    const focus = cars.find(car => !car.ai && car.finishedAt === null) ?? player;
    this.section = active ? raceSection(session, focus, this.section) : 'groove';
    const coachWarning = session.guidanceEnabled && player.coach?.action === 'brake';
    const duck = coachWarning ? .48 : focus.skid > .3 ? .65 : 1;
    smooth(this.effects.gain, this.effectsVolume, now);
    smooth(this.music.gain, active ? this.musicVolume * .38 * duck : 0, now, .1);
    this.score.update(active && this.musicVolume > 0, clamp(focus.speed / 3.8), this.section);

    const present = new Set();
    const humanCount = cars.filter(car => !car.ai).length;
    for (const [index, car] of cars.entries()) {
      present.add(car.id);
      const v = this.voice(car.id, 0);
      const listener=focus.crash??focus.pose, source=car.crash??car.pose;
      const dx=(source?.x??0)-(listener?.x??0), dy=(source?.y??0)-(listener?.y??0);
      const distance=Math.hypot(dx,dy,(source?.z??0)-(listener?.z??0));
      const presence=1/(1+(distance/2.4)**1.55);
      const heading=listener?.angle??0;
      const pan=(dy*Math.cos(heading)-dx*Math.sin(heading))/Math.max(1,distance)*.85;
      smooth(v.pan.pan, pan, now);
      const running = active && car.state === 'slotted' && car.finishedAt === null;
      smooth(v.tunnel.gain, running && car.pose?.tunnel ? .34 : 0, now, .035);
      const speed = car.speed, load = car.throttle, skid = running ? car.skid : 0;
      const weight = presence * (car.ai ? .64 : humanCount > 1 ? .62 : 1);
      // Approximate a 24 mm tyre, a 3:1 final drive and a nine-tooth pinion.
      const wheelHz = speed / (Math.PI * .024);
      const shaftHz = wheelHz * 3;
      const motorHz = 42 + shaftHz * (2+.016*(index%5)) + load * 12;
      const meshHz = 80 + shaftHz * 9;
      const motion = clamp(speed / .6);
      smooth(v.engine.o.frequency, motorHz, now, .055);
      smooth(v.engine.f.frequency, 320 + presence * (220 + speed * 320 + load * 1050), now);
      smooth(v.engine.g.gain, running ? (.021 * motion + .034 * load) * weight : 0, now);
      smooth(v.sub.o.frequency, motorHz / 2, now);
      smooth(v.sub.g.gain, running ? (.009 * motion + .016 * load) * weight : 0, now);
      smooth(v.gear.o.frequency, meshHz, now, .035);
      smooth(v.gear.f.frequency, meshHz, now, .035);
      smooth(v.gear.g.gain, running ? motion * (.009 + .017 * load) * weight : 0, now);
      smooth(v.rail.f.frequency, 380 + wheelHz * 18, now);
      smooth(v.rail.g.gain, running ? clamp(speed / 4) * .042 * weight : 0, now);
      smooth(v.tyre.o.frequency, 900 + skid * 850 + Math.sin(now * 32) * skid * 70, now, .025);
      smooth(v.tyre.g.gain, skid * .045 * weight, now, .025);
      smooth(v.rubber.g.gain, skid * .075 * weight, now, .025);

      const braking = running && load < .15 && speed > .12;
      const gap = now - v.updatedAt;
      const continuous = this.active && v.wasState === 'slotted' && v.updatedAt !== null && gap > 0 && gap < .25;
      const deceleration = continuous ? clamp((v.previousSpeed - speed) / gap / 4) : 0;
      smooth(v.coast.f.frequency, 280 + shaftHz * 5, now, .035);
      smooth(v.coast.g.gain, braking ? motion * (.023 + .055 * deceleration) * weight : 0, now, .035);
      if (!continuous) v.releaseArmed = false;
      if (running && load > .3) v.releaseArmed = true;
      if (continuous && braking && v.releaseArmed) {
        v.releaseArmed = false;
        this.brushRelease(v.pan, meshHz, .035 * motion * weight);
      }
      if (active && this.active && car.state === 'derailed' && v.wasState !== 'derailed') this.impact(weight);
      v.previousSpeed = speed;
      v.updatedAt = running ? now : null;
      v.wasState = car.state;
    }
    for (const [id, voice] of this.voices) {
      if (present.has(id)) continue;
      for (const part of ['engine', 'sub', 'gear', 'rail', 'tyre', 'rubber', 'coast']) smooth(voice[part].g.gain, 0, now);
      smooth(voice.tunnel.gain, 0, now);
      voice.updatedAt = null;
    }
    if(active&&session.guidanceEnabled&&player.coach?.action==='brake'&&player.throttle>.1&&now-this.lastCue>1.6){this.chirp(740,520,.15,.07);this.lastCue=now;}
    this.active=active;
  }
  brushRelease(output, pitch, volume) {
    const c = this.context, now = c.currentTime;
    const noise = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    noise.buffer = this.noise;
    filter.type = 'bandpass';
    filter.Q.value = 2.2;
    filter.frequency.setValueAtTime(pitch, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, pitch * .42), now + .12);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .16);
    noise.connect(filter).connect(gain).connect(output);
    noise.start(now); noise.stop(now + .17);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  chirp(from,to,duration=.16,volume=.045,delay=0){
    if(!this.context||!this.enabled)return;const c=this.context,now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(from,now);o.frequency.exponentialRampToValueAtTime(to,now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(this.effects);o.start(now);o.stop(now+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  impact(weight=1){const c=this.context,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;n.buffer=this.noise;f.type='lowpass';f.frequency.value=1100;g.gain.setValueAtTime(.16*weight,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);n.connect(f).connect(g).connect(this.effects);n.start(t);n.stop(t+.32);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();};this.chirp(120,40,.3,.07*weight);}
  beep(go=false){this.chirp(go?1047:698,go?1047:698,go?.24:.14,.08);}
  event(type){if(type==='switch')this.chirp(440,1320,.13,.055);if(type==='lap'){this.chirp(784,784,.13,.06);this.chirp(1047,1047,.19,.06,.13);}if(type==='finish')for(let i=0;i<4;i++)this.chirp([523,659,784,1047][i],[523,659,784,1047][i],.28,.07,i*.13);}
  destroy(){this.context?.close();this.voices.clear();}
}
