/** DOM-free state allows independent switches, keys and touches per player. */
export class DriverInput {
  constructor(){this.held=new Set();this.latched=false;this.pendingSwitch=false;}
  press(source,toggle=false){if(toggle)this.latched=!this.latched;else this.held.add(source);}
  get throttle(){return this.latched||this.held.size>0?1:0;}
  read(){const input={throttle:this.throttle,switchLane:this.pendingSwitch};this.pendingSwitch=false;return input;}
  clear(){this.held.clear();this.latched=false;this.pendingSwitch=false;}
}
export const PLAYER_KEYS = [
  {gas:'Space',lane:['Enter','NumpadEnter','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight']},
  {gas:'KeyW',lane:['KeyE']},
  {gas:'KeyI',lane:['KeyO']},
];

export function normalizePower(value){const n=Number(value);return Number.isFinite(n)?Math.max(.2,Math.min(1,Math.round(n*20)/20)):.65;}
