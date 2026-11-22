import { RACE } from '../core/config.js';
// Original 136 BPM score; Web Audio time owns the musical clock.
export const BPM = 136;
export const STEP = 60 / BPM / 4;
const notes = [38,null,38,50,null,41,null,38,45,null,38,null,48,45,null,41];
const melody = [62,null,null,69,null,null,65,null,72,null,69,null,65,null,60,null];
export function scoreStep(step) {
  const bar = Math.floor(step / 16), beat = step % 16;
  return { kick: beat % 4 === 0, hat: beat % 4 === 2 || bar % 4 === 3 && beat % 2 === 1,
    clap: beat === 4 || beat === 12, bass: notes[beat] === null ? null : notes[beat] + (Math.floor(bar / 8) % 2 ? -2 : 0),
    lead: bar % 8 >= 4 ? melody[(beat + Math.floor(bar/4)*2) % 16] : null };
}
export function raceSection(session, focus, previous) {
  if (focus.state === 'derailed') return 'recovery';
  if (session.tutorial || session.mode === 'time') return 'groove';
  if (focus.laps >= RACE.laps - 1) return 'final';
  // Separate thresholds avoid switching repeatedly at the edge of a duel.
  const distance = previous === 'duel' ? 2.4 : 1.5;
  const close = session.elapsed > 3 && session.cars?.some(car =>
    car !== focus && car.state === 'slotted' && car.finishedAt === null && Math.abs(car.distance - focus.distance) <= distance);
  return close ? 'duel' : 'groove';
}

export class RacingScore {
  constructor(context, output, noise) {
    this.context=context; this.output=output; this.noise=noise; this.next=0; this.step=0; this.running=false;
    this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1400;this.filter.connect(output);
  }
  tone(frequency, time, duration, volume, type='sine', end=frequency) {
    const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,time);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),time+duration*.6);
    g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(volume,time+.006);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(g).connect(this.filter);o.start(time);o.stop(time+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  percussion(time,duration,volume,frequency) {
    const c=this.context,n=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();n.buffer=this.noise;f.type='highpass';f.frequency.value=frequency;
    g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);n.connect(f).connect(g).connect(this.output);n.start(time);n.stop(time+duration+.01);n.onended=()=>{n.disconnect();g.disconnect();f.disconnect();};
  }
  update(active, intensity=0, requestedSection='groove') {
    const now=this.context.currentTime;
    if(!active){this.running=false;return;}
    if(!this.running){this.running=true;this.next=now+.04;this.step=0;}
    if(this.next<now-.1)this.next=now+.025;
    this.filter.frequency.setTargetAtTime(900+intensity*2600,now,.2);
    while(this.next<now+.11){
      if (this.step % 16 === 0) this.section = requestedSection;
      const p=scoreStep(this.step),t=this.next, beat=this.step%16;
      if (this.section === 'recovery') {
        if (beat === 0 || beat === 8) this.tone(96, t, .19, .25, 'sine', 45);
      } else {
        if(p.kick)this.tone(135,t,.27,.5,'sine',43);
        if(p.hat)this.percussion(t,.055,.08,6500);
        if(p.clap){this.percussion(t,.105,.075,1450);this.percussion(t+.014,.065,.055,1800);}
        if(p.bass!==null)this.tone(440*2**((p.bass-69)/12),t,.12,.075,'sawtooth');
        if(p.lead!==null&&intensity>.3)this.tone(440*2**((p.lead-69)/12),t,.16,.026,'triangle');
        if (this.section === 'duel' && (beat === 3 || beat === 10 || beat === 14)) {
          this.tone(beat === 10 ? 185 : 145, t, .115, .105, 'sine', 67);
        }
        if (this.section === 'final' && beat % 4 === 2) {
          this.percussion(t, STEP * 2.8, .095, 4800);
          this.tone(1437, t, .14, .013, 'triangle', 1418);
        }
      }
      this.next+=STEP;this.step=(this.step+1)%256;
    }
  }
}
