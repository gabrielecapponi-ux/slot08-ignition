import {setWeather} from '../track/weather.js';
import {courseRevision} from '../track/championship.js';
import { resolveContacts } from '../physics/contacts.js';
import { MEETINGS, positionClubSwitches, passingLaneClear, trafficAhead } from './club.js';
import { FLEET } from './tour.js';
import { SectorClock } from './sector-clock.js';
import { brakingAdvice } from './braking-guide.js';
import { createTrack } from '../track/catalog.js';
import { carSetup, DIFFICULTIES } from './setup.js';
import { PhysicsEngine } from '../physics/engine.js';
import { createCar } from '../physics/car.js';
import { AIDriver } from '../ai/driver.js';
import { RACE, COLORS } from '../core/config.js';

export class RaceSession {
  constructor({ onEvent = () => {}, seed = 808 } = {}) {
    this.phase='race';this.rivalRating=[0,0,0,0,0];this.tuning='balanced';this.hazards=false;this.carIndex=0;this.clubRound=0;this.appearance={};this.guidance='auto';this.seed = seed; this.raceNumber = 0; this.level = 0; this.difficulty = 'club'; this.assisted = false; this.upgrades = {}; this.track = createTrack(0); this.physics = new PhysicsEngine(this.track);
    this.onEvent = onEvent; this.mode = 'race'; this.reset();
  }
  reset(mode = this.mode) {
    this.phase='race';this.grid=null;this.qualifying=null;this.eliminationOrder=[];this.nextElimination=45;this.tutorial = null; this.reward = null; this.raceNumber++;
    this.meeting = mode === 'campaign' ? MEETINGS[this.clubRound] : null;
    if(this.meeting){this.level=this.meeting.level;}
    this.track = createTrack(this.level,{stunt:mode,lanes:['campaign','grandprix','elimination','race','masone','riviera'].includes(mode)?4:2,variant:this.meeting?this.clubRound:mode==='grandprix'&&Number.isInteger(this.mixCourse)?this.mixCourse:-1});
    if(!this.hazards)this.track.conditions=[];
    setWeather(this.track,this.weatherChoice??'auto');
    if(this.meeting){this.track.meeting=this.meeting;positionClubSwitches(this.track);}
    this.physics = new PhysicsEngine(this.track);
    this.assistant = new AIDriver(this.track, .82);
    this.sectors = mode === 'time' ? new SectorClock(RACE.startDistance, this.track.length) : null;
    this.mode = mode; this.status = 'ready'; this.previousStatus = 'running';
    this.celebration=0;this.elapsed = 0; this.countdown = RACE.countdown; this.notice = ''; this.noticeTTL = 0;
    this.cars = [createCar({ color: COLORS.mint, setup: carSetup(this.difficulty, this.upgrades) })];
    this.drivers = new Map();
    if (mode === 'masone' || mode === 'riviera' || mode === 'race' || mode === 'grandprix' || mode==='elimination' || this.meeting) {
      const grid=this.track.laneCount===4?(this.meeting||mode==='grandprix'?[1,2,0,3,1,2]:[0,1,2,3,0,1]):[0,1,0,1,0,1];
      this.cars[0].lane=grid[0];
      const rivals=[['Apex',COLORS.orange],['Volt',COLORS.blue],['Nitro',COLORS.pink],['Nyx','#bf82ff'],['Sol','#ffd453']];
      rivals.forEach(([name,color],i)=>{
        const row=Math.floor((i+1)/this.track.laneCount);
        this.cars.push(createCar({id:'ai-'+(i+1),name,color,lane:grid[i+1],ai:true,
          start:RACE.startDistance-row*.65,setup:carSetup(this.difficulty,this.upgrades)}));
      });
      if(this.meeting) for(const [i,bot] of this.cars.slice(1).entries()){const level=Math.max(0,Math.min(20,this.meeting.world+Math.floor((this.meeting.round+1)/3)+Math.round(this.rivalRating[i]||0)));bot.rivalLevel=level;bot.setup=carSetup(this.difficulty,{motor:level+2,grip:level+1,brake:level+2,gearing:level+1,brush:2});bot.maxGrip=bot.setup.gripForce;}
      const standard=DIFFICULTIES[this.difficulty];
      const competitive=!this.assisted && this.difficulty!=='rookie';
      const d=competitive?{...standard,pace:standard.pace+.032,reaction:standard.reaction*.78,errorRate:standard.errorRate*.55}:standard;
      this.drivers.set('ai-1', new AIDriver(this.track, d.pace, {reaction:d.reaction,errorRate:d.errorRate,seed:this.seed + this.raceNumber * 7919,tactical:true}));
      if(this.cars.length>3)this.drivers.set('ai-3',new AIDriver(this.track,d.pace-.01,{reaction:d.reaction*1.05,errorRate:d.errorRate,seed:this.seed+this.raceNumber*2357,tactical:true}));
      this.drivers.set('ai-2', new AIDriver(this.track, d.pace-.025, {reaction:d.reaction*1.15,errorRate:d.errorRate*1.1,seed:this.seed + this.raceNumber * 3571 + 17,tactical:true}));
      for(const i of [4,5])this.drivers.set('ai-'+i,new AIDriver(this.track,d.pace-(i-4)*.016,{
        reaction:d.reaction*(i===4?.85:.94),errorRate:d.errorRate*.65,seed:this.seed+this.raceNumber*179+i,tactical:true}));
    }
    if (mode === 'local2' || mode === 'local3') {
      this.cars[0].name='Pilota 1';
      this.cars.push(createCar({id:'p2',name:'Pilota 2',color:COLORS.orange,lane:1,setup:carSetup(this.difficulty,this.upgrades)}));
      if(mode==='local3')this.cars.push(createCar({id:'p3',name:'Pilota 3',color:COLORS.blue,lane:0,start:RACE.startDistance-.40,setup:carSetup(this.difficulty,this.upgrades)}));
    }
    this.localFinishAt=null;this.coachTick=0;
    const available=FLEET.map((spec,id)=>({spec,id})).filter(({spec})=>spec.world<=(this.meeting?.world??0));
    this.cars.forEach((car,index)=>{
      // Local and quick races use equal running gear. Club rivals bring their own cars.
      car.chassis=this.carIndex;
      if(car.ai && this.meeting){
        const opponents=available.filter(({id})=>id!==this.carIndex);
        car.chassis=opponents.length?opponents[(this.clubRound+index-1)%opponents.length].id:available[0].id;
      }
      const spec=FLEET[car.chassis];
      car.setup.maxSpeed*=spec.speed;car.setup.motorForce*=spec.drive;car.maxGrip*=spec.grip;
      const rivalSetup=car.ai && this.meeting;
      car.upgrades=rivalSetup?{motor:car.rivalLevel,grip:car.rivalLevel,brake:car.rivalLevel}:{...this.upgrades};
      car.appearance=rivalSetup?{}:{...this.appearance};
      car.maxGrip*=1+.003*(car.appearance.wheels||0)+.002*(car.appearance.wing||0);
      if(this.meeting)car.maxGrip*=this.difficulty==='rookie'?.97:this.difficulty==='pro'?.90:.94;
      if(!car.ai&&this.upgrades.motor>=20){if(this.tuning==='sprint'){car.setup.motorForce*=1.045;car.maxGrip*=.985;}if(this.tuning==='endurance'){car.setup.maxSpeed*=.98;car.setup.engineBrake*=1.06;}}
      if(index===0 && this.appearance.paint)car.color=this.appearance.paint;
      car.pose=this.track.pose(car.distance,car.lane);
    });
    this.onEvent({ type: 'reset' });
  }
  configure({ hazards=this.hazards, level=this.level, difficulty=this.difficulty, assisted=this.assisted, upgrades=this.upgrades, appearance=this.appearance }={}) {
    this.hazards=hazards;this.appearance={...appearance};this.level=level; this.difficulty=difficulty; this.assisted=assisted; this.upgrades={...upgrades}; this.reset();
  }
  get recordKey() {return [this.meeting?'club'+courseRevision(this.clubRound):'club14',this.phase,...(this.track.weather==='dry'?[]:[this.track.weather]),this.hazards?'conditions':'clean',this.meeting?this.clubRound:'free',this.carIndex,this.level,this.mode,this.difficulty,this.assisted?'assist':'manual',this.appearance.wheels||0,this.appearance.wing||0,...Object.values(this.upgrades)].join(':');}
  beginTutorial() { this.level=0; this.reset('time'); this.tutorial={step:0,initialLane:0}; this.status='running'; }
  get isLocal() { return this.mode==='local2'||this.mode==='local3'; }
  get players() { return this.cars.filter(c=>!c.ai); }
  get guidanceEnabled() { return this.guidance==='on'||this.guidance==='auto'&&(this.level<4||!!this.tutorial); }
  get player() { return this.cars[0]; }
  start() { if (this.status === 'ready') { this.status = 'countdown'; this.onEvent({ type: 'start' }); } }
  beginQualifying(){
    if(this.status!=='ready'||!['campaign','grandprix'].includes(this.mode))return false;
    this.phase='qualifying';this.qualifying={laps:2,playerDoneAt:null};this.sectors=new SectorClock(RACE.startDistance,this.track.length);
    for(const car of this.cars){car.start=RACE.startDistance;car.distance=car.start;car.pose=this.track.pose(car.distance,car.lane);}
    this.start();return true;
  }
  finishQualifying(){
    this.grid=[...this.cars].sort((a,b)=>a.bestLap-b.bestLap||a.id.localeCompare(b.id)).map((c,i)=>({id:c.id,name:c.name,time:c.bestLap,position:i+1}));
    this.status='qualified';this.onEvent({type:'qualified'});
  }
  startGrid(){
    if(this.status!=='qualified')return false;
    const grid=this.grid;this.reset();this.grid=grid;
    // Staggered rows on the same start straight; the timing line is shared.
    for(const car of this.cars){const rank=grid.findIndex(p=>p.id===car.id);car.gridPosition=rank+1;car.lane=[1,2,0,3,1,2][rank];car.distance=RACE.startDistance-.34*rank;car.start=car.distance;car.pose=this.track.pose(car.distance,car.lane);}
    this.start();return true;
  }
  pause() {
    if (this.status === 'running' || this.status === 'countdown') {
      this.previousStatus = this.status; this.status = 'paused'; this.onEvent({ type: 'pause' });
    }
  }
  resume() { if (this.status === 'paused') { this.status = this.previousStatus; this.onEvent({ type: 'resume' }); } }
  toast(text) { this.notice = text; this.noticeTTL = 2; }
  update(dt, playerInput) {
    if (this.status === 'countdown') {
      const previous = Math.ceil(this.countdown);
      this.countdown = Math.max(0, this.countdown - dt);
      if (Math.ceil(this.countdown) !== previous) this.onEvent({ type: 'beep', go: this.countdown === 0 });
      if (this.countdown === 0) { this.status = 'running'; this.toast('VIA! Trova il ritmo.'); }
      return;
    }
    if(this.status==='finished'){this.celebration=Math.min(8,this.celebration+dt);return;}
    if (this.status !== 'running') return;
    this.elapsed += dt;
    this.noticeTTL = Math.max(0, this.noticeTTL - dt);
    const inputs=Array.isArray(playerInput)?playerInput:[playerInput];
    const rawThrottle=inputs[0]?.throttle??0;
    this.coachTick-=dt;const updateCoach=this.coachTick<=0;if(updateCoach)this.coachTick=.08;
    let playerFinished = false;
    for (const car of this.cars) {
      if (car.finishedAt !== null||car.eliminatedAt!=null) continue;
      let input = car.ai ? this.drivers.get(car.id).input(car, dt, this.phase==='qualifying'?[]:this.cars) : (inputs[this.players.indexOf(car)]??{throttle:0,switchLane:false});
      if (input.switchLane && car.state==='slotted' && !car.change) {
        car.switchQueued=!car.switchQueued;
        if(!car.ai)this.toast(car.switchQueued?'SCAMBIO PRENOTATO · alla prossima X':'Scambio annullato');
      }
      if(car.switchQueued && (!car.ai || passingLaneClear(this.track,car,this.cars)) && this.physics.changeLane(car)){car.switchQueued=false;if(!car.ai)this.onEvent({type:'switch',car});}
      if(!car.ai && (this.assisted||this.tutorial)){
        const guide=this.assistant.input(car,dt);
        car.assistanceActive=input.throttle>guide.throttle+.05;
        input={...input,throttle:Math.min(input.throttle,guide.throttle)};
      }else car.assistanceActive=false;

      if(!car.ai&&updateCoach)car.coach=this.guidanceEnabled?brakingAdvice(this.track,car):null;
      const beforeDistance = car.distance;
      const event = this.physics.step(car, input.throttle, dt);
      if(event==='respawn')car.rejoinUntil=this.elapsed+1.1;
      if (event) this.onEvent({ type: event, car });
      if(this.tutorial && !car.ai){
        const t=this.tutorial;
        if(t.step===0 && car.speed>.8){t.step=1;this.onEvent({type:'tutorial-step'});}
        else if(t.step===1 && !rawThrottle && car.speed<.25){t.step=2;this.onEvent({type:'tutorial-step'});}
        else if(t.step===2 && car.lane!==t.initialLane && !car.change){t.step=3;this.status='tutorial-complete';this.onEvent({type:'tutorial-complete'});}
        continue;
      }
      if (this.sectors && car === this.player && car.state === 'slotted') {
        this.sectors.advance(beforeDistance, car.distance, this.elapsed, dt);
      }
      const finishLine = RACE.startDistance + (car.laps + 1) * this.track.length;
      if (car.distance >= finishLine && car.state === 'slotted') {
        // Interpolate crossing within this fixed step for lap-time precision.
        const fraction = Math.min(1, (car.distance - finishLine) / Math.max(1e-9, car.distance - beforeDistance));
        const crossedAt = this.elapsed - fraction * dt;
        const lap = crossedAt - car.lapStartedAt;
        car.lastLap = lap; car.bestLap = Math.min(car.bestLap, lap);
        car.lapTimes.push(lap); car.lapStartedAt = crossedAt; car.laps++;
        const clean=!car.ai && this.phase==='race' && this.cars.length===6 && car.crashes===(car.lastLapCrashes||0);
        if(!car.ai && this.phase==='race' && this.cars.length===6){
          if(clean)car.cleanLaps=(car.cleanLaps||0)+1;
          car.lastLapCrashes=car.crashes;
        }
        this.onEvent({ type: 'lap', car, lap, clean });
        if (this.mode !== 'time' && this.mode!=='elimination' && car.laps >= (this.phase==='qualifying'?2:RACE.laps)) {
          car.finishedAt = crossedAt; car.speed = 0;
          if (!car.ai) {playerFinished = true;if(this.isLocal&&this.localFinishAt===null)this.localFinishAt=crossedAt;}
        }
      }
    }
    if(this.cars.length>1&&this.phase!=='qualifying'){
      resolveContacts(this.track,this.cars,this.physics,this.onEvent,this.elapsed);
      for(const wreck of this.cars.filter(c=>c.crash && c.recoverIn>0)){
        for(const rival of this.cars){
          if(rival.state!=='slotted'||rival.finishedAt!==null||rival.rejoinUntil>this.elapsed||rival.speed<.45)continue;
          const a=wreck.crash,b=rival.pose;
          if(a.other===rival.id && rival.punted===wreck.id && wreck.recoverIn>2.4)continue;
          if(Math.hypot(a.x-b.x,a.y-b.y)<.19 && Math.abs(a.z-b.z-.077)<.13){
            a.hit=true;
            this.physics.derail(rival,b);
            const impact=rival.crash;
            impact.vx=impact.vx*.75+a.vx*.25;
            impact.vy=impact.vy*.75+a.vy*.25;
            rival.contactCrashes=(rival.contactCrashes||0)+1;
            impact.vz+=.18;impact.hit=true;impact.other=wreck.id;a.other=rival.id;
            a.vx*=.78;a.vy*=.78;
            this.onEvent({type:'derail',car:rival});break;
          }
        }
      }
    }
    if(this.phase==='qualifying'){
      if(playerFinished)this.qualifying.playerDoneAt=this.elapsed;
      if(this.cars.every(c=>c.finishedAt!==null)||this.qualifying.playerDoneAt!==null&&this.elapsed-this.qualifying.playerDoneAt>35)this.finishQualifying();
      return;
    }
    if(this.mode==='elimination'&&this.elapsed>=this.nextElimination){
      const active=this.standings().filter(c=>c.eliminatedAt==null),last=active.at(-1);
      last.eliminatedAt=this.elapsed;last.speed=0;last.state='eliminated';this.eliminationOrder.push(last.id);this.nextElimination+=35;
      this.toast(last.name.toUpperCase()+' ELIMINATO');this.onEvent({type:'elimination',car:last});
      if(last===this.player||active.length===2){active[0].finishedAt=this.elapsed;this.status='finished';this.onEvent({type:'finish'});return;}
    }
    const localDone=this.isLocal&&(this.players.every(c=>c.finishedAt!==null)||this.localFinishAt!==null&&this.elapsed-this.localFinishAt>=30);
    if (this.isLocal?localDone:playerFinished) { this.status = 'finished'; this.onEvent({ type: 'finish' }); }
  }
  standings() {
    return [...this.cars].sort((a, b) => {
      if(a.eliminatedAt!=null||b.eliminatedAt!=null){if(a.eliminatedAt==null)return -1;if(b.eliminatedAt==null)return 1;return b.eliminatedAt-a.eliminatedAt;}
      if (a.finishedAt !== null && b.finishedAt !== null) return a.finishedAt - b.finishedAt;
      if (a.finishedAt !== null) return -1;
      if (b.finishedAt !== null) return 1;
      return b.distance - a.distance;
    });
  }
}
