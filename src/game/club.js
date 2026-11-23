export { MEETINGS } from './tour.js';
export function meetingGoal(event) {
  return ['','Vinci la gara','Arriva fra i primi due','Completa tre giri'][event.rank];
}

// Signed shortest gap on the circuit also detects a car one lap behind.
export function laneGap(track, car, other) {
  const length = track.length;
  return ((other.distance-car.distance+length/2)%length+length)%length-length/2;
}

export function trafficAhead(track, car, cars) {
  let gap=Infinity;
  for (const other of cars) {
    if (other===car || other.state!=='slotted' || other.finishedAt!=null) continue;
    if (other.lane!==car.lane && other.change?.to!==car.lane) continue;
    const distance=laneGap(track,car,other);
    if (distance>0) gap=Math.min(gap,distance);
  }
  return gap;
}

export function passingLaneClear(track,car,cars) {
  const ahead=track.nextSwitchDistance(car.distance),gate=track.switchAt(car.distance)??track.switchAt(car.distance+ahead+.001);
  const target=gate?(track.switchTarget?.(gate,car.lane)??1-car.lane):1-car.lane;
  if(target===car.lane)return false;
  return cars.every(other=>{
    if (other===car || other.state!=='slotted' || other.finishedAt!=null) return true;
    if(other.lane!==target && other.change?.to!==target)return true;
    const gap=laneGap(track,car,other);
    const projected=gap+(other.speed-car.speed)*.55;
    return Math.min(gap,projected)>.43 || Math.max(gap,projected)<-.43;
  });
}

// Move an X towards the braking approach, keeping the whole module on visible straight track.
export function positionClubSwitches(track) {
  for (const gate of track.switches) {
    const length=gate.end-gate.start;
    let best=gate.start;
    const section=track.sample(gate.start).section;
    const module=track.segments?.[section];
    const limit=module?.type==='line'?module.start+module.length:track.length;
    for(let s=gate.start;s<limit-length-.8;s+=.25){
      if(Math.abs(track.sample(s+length+.8).curvature)>.001) break;
      if((!track.jump||s+length<track.jump.start-3||s>track.jump.start+track.jump.length+3)&&!track.tunnels.some(t=>s<t.end+.35 && s+length>t.start-.35)&&(!track.fork||s+length<track.fork.start||s>track.fork.end)) best=s;
    }
    const offset=best-gate.start;
    gate.start+=offset;gate.activationEnd+=offset;gate.end+=offset;
  }
}
