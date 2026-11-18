import { createTrack } from '../track/catalog.js';
import { carSetup, DIFFICULTIES } from './setup.js';
import { PhysicsEngine } from '../physics/engine.js';
import { createCar } from '../physics/car.js';
import { AIDriver } from '../ai/driver.js';
import { RACE, COLORS } from '../core/config.js';

export class RaceSession {
  constructor({ onEvent = () => {} } = {}) {
    this.level = 0; this.difficulty = 'rookie'; this.assisted = true; this.upgrades = {}; this.track = createTrack(0); this.physics = new PhysicsEngine(this.track);
    this.onEvent = onEvent; this.mode = 'race'; this.reset();
  }
  reset(mode = this.mode) {
    this.tutorial = null; this.reward = null;
    this.track = createTrack(this.level); this.physics = new PhysicsEngine(this.track);
    this.assistant = new AIDriver(this.track, .88);
    this.mode = mode; this.status = 'ready'; this.previousStatus = 'running';
    this.elapsed = 0; this.countdown = RACE.countdown; this.notice = ''; this.noticeTTL = 0;
    this.cars = [createCar({ color: COLORS.mint, setup: carSetup(this.difficulty, this.upgrades) })];
    this.drivers = new Map();
    if (mode === 'race') {
      this.cars.push(createCar({ id: 'ai-1', name: 'Apex', color: COLORS.orange, lane: 1, ai: true, setup: carSetup(this.difficulty) }));
      this.cars.push(createCar({ id: 'ai-2', name: 'Volt', color: COLORS.blue, lane: 0, ai: true, start: RACE.startDistance - 0.40, setup: carSetup(this.difficulty) }));
      this.drivers.set('ai-1', new AIDriver(this.track, DIFFICULTIES[this.difficulty].pace));
      this.drivers.set('ai-2', new AIDriver(this.track, DIFFICULTIES[this.difficulty].pace-.04));
    }
    this.cars.forEach(c => { c.pose = this.track.pose(c.distance, c.lane); });
    this.onEvent({ type: 'reset' });
  }
  configure({ level=this.level, difficulty=this.difficulty, assisted=this.assisted, upgrades=this.upgrades }={}) {
    this.level=level; this.difficulty=difficulty; this.assisted=assisted; this.upgrades={...upgrades}; this.reset();
  }
  get recordKey() { return [this.level,this.mode,this.difficulty,this.assisted?'assist':'manual',...Object.values(this.upgrades)].join(':'); }
  beginTutorial() { this.level=0; this.reset('time'); this.tutorial={step:0,initialLane:0}; this.status='running'; }
  get player() { return this.cars[0]; }
  start() { if (this.status === 'ready') { this.status = 'countdown'; this.onEvent({ type: 'start' }); } }
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
    if (this.status !== 'running') return;
    this.elapsed += dt;
    this.noticeTTL = Math.max(0, this.noticeTTL - dt);
    const rawThrottle=playerInput.throttle;
    for (const car of this.cars) {
      if (car.finishedAt !== null) continue;
      let input = car.ai ? this.drivers.get(car.id).input(car) : playerInput;
      if (input.switchLane && car.state==='slotted' && !car.change) {
        car.switchQueued=!car.switchQueued;
        if(!car.ai)this.toast(car.switchQueued?'SCAMBIO PRENOTATO · alla prossima X':'Scambio annullato');
      }
      if(car.switchQueued && this.physics.changeLane(car)){car.switchQueued=false;if(!car.ai)this.onEvent({type:'switch'});}
      if(!car.ai){const guide=this.assistant.input(car);car.assistanceActive=(this.assisted||!!this.tutorial)&&input.throttle>guide.throttle+.05;if(this.assisted||this.tutorial)input={...input,throttle:Math.min(input.throttle,guide.throttle)};}

      const beforeDistance = car.distance;
      const event = this.physics.step(car, input.throttle, dt);
      if (event) this.onEvent({ type: event, car });
      if(this.tutorial && !car.ai){
        const t=this.tutorial;
        if(t.step===0 && car.speed>.8){t.step=1;this.onEvent({type:'tutorial-step'});}
        else if(t.step===1 && !rawThrottle && car.speed<.25){t.step=2;this.onEvent({type:'tutorial-step'});}
        else if(t.step===2 && car.lane!==t.initialLane && !car.change){t.step=3;this.status='tutorial-complete';this.onEvent({type:'tutorial-complete'});}
        continue;
      }
      const finishLine = RACE.startDistance + (car.laps + 1) * this.track.length;
      if (car.distance >= finishLine && car.state === 'slotted') {
        // Interpolate crossing within this fixed step for lap-time precision.
        const fraction = Math.min(1, (car.distance - finishLine) / Math.max(1e-9, car.distance - beforeDistance));
        const crossedAt = this.elapsed - fraction * dt;
        const lap = crossedAt - car.lapStartedAt;
        car.lastLap = lap; car.bestLap = Math.min(car.bestLap, lap);
        car.lapTimes.push(lap); car.lapStartedAt = crossedAt; car.laps++;
        this.onEvent({ type: 'lap', car, lap });
        if (this.mode === 'race' && car.laps >= RACE.laps) {
          car.finishedAt = crossedAt; car.speed = 0;
          if (!car.ai) { this.status = 'finished'; this.onEvent({ type: 'finish' }); }
        }
      }
    }
  }
  standings() {
    return [...this.cars].sort((a, b) => {
      if (a.finishedAt !== null && b.finishedAt !== null) return a.finishedAt - b.finishedAt;
      if (a.finishedAt !== null) return -1;
      if (b.finishedAt !== null) return 1;
      return b.distance - a.distance;
    });
  }
}
