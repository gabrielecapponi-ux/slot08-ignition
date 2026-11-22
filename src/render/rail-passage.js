import { PHYSICS } from '../core/config.js';
import { mod } from '../core/math.js';

// Select actual conductor locations once per layout, clear of points and tunnel mouths.
export function railSites(track) {
  const sites=[];
  for(let at=.6;at<track.length-.8;at+=.6){
    const p=track.sample(at);
    if(Math.abs(p.curvature)<.10 || track.tunnelAt?.(at,.60))continue;
    if(track.switches.some(g=>at>g.start-.3 && at<g.end+.3))continue;
    sites.push({at,p,wire:sites.length%2?1:-1});
    at+=5.1;
  }
  return sites;
}

export function passageGlint(track,sites,car){
  if(car.state!=='slotted'||car.speed<.55||car.change)return null;
  const head=mod(car.distance+.43,track.length);
  // The glint brightens just ahead of the nose, then dies as the guide crosses it.
  for(const site of sites){
    const delta=site.at-head;
    if(Math.abs(delta)>=.40)continue;
    const d=track.laneOffset(car.lane)+site.wire*.026,p=site.p;
    const bank=p.bank||0,amount=Math.cos(delta*Math.PI/0.8)**2;
    return {x:p.x+p.nx*d*Math.cos(bank),y:p.z+.085-d*Math.sin(bank),
      z:p.y+p.ny*d*Math.cos(bank),angle:Math.atan2(p.ty,p.tx),pitch:Math.atan(p.grade||0),amount};
  }
  return null;
}

