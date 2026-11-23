import { drawChase } from './chase-canvas.js';
import { SoftwareGarage } from './garage-software.js';
import {dioramaTiles,groundSwatch} from './diorama-surface.js';
import { createLandscape } from '../track/landscape.js';
import { THEMES } from '../track/themes.js';
import { railSites, passageGlint } from './rail-passage.js';
import { PHYSICS } from '../core/config.js';
import { racePose } from './race-pose.js';
/** Playable no-WebGL fallback. Never runs concurrently with the 3D renderer. */
export class Canvas2D {
  constructor(canvas,track,{onStatus}={}){this.kind='2d';this.canvas=canvas;this.track=track;this.glintSites=railSites(track);this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');this.ctx=canvas.getContext('2d');this.view='top';this.studio=new SoftwareGarage(()=>{this.dirty=true;});this.ready=this.studio.ready;this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();onStatus?.('VISTA 2D · COMPATIBILITÀ');}
  resize(){this.backdrop=null;this.dirty=true;const r=this.canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);this.canvas.width=r.width*d;this.canvas.height=r.height*d;const b=this.track.bounds;this.scale=Math.min(this.canvas.width/(b.maxX-b.minX+1),this.canvas.height/(b.maxY-b.minY+3));}
  setView(mode){this.view=mode;this.dirty=true;}
  fitPart(key){this.studio.fit={key,start:performance.now()};}
  setGarage(flag,appearance,upgrades,chassis=0){if(!flag)this.studio.fit=null;this.garage=flag;this.preview={appearance,upgrades,chassis};this.dirty=true;}
  setGarageView(angle){this.studio.rig.detail=null;this.studio.rig.zoom=1;this.studio.rig.elevation=.28;this.studio.rig.manual=true;this.studio.rig.garageAngle=angle;}
  centerGarage(){this.setGarageView(.65);this.studio.rig.initial=true;}
  inspect(key){const r=this.studio?.rig;if(!r)return;r.detail=key;r.garageAngle=key==='motor'?2.5:.65;r.elevation=['under','brake','motor','grip','brush','gearing','diffuser'].includes(key)?-.58:.28;r.manual=false;r.zoom=1;}
  orbit(dx,dy){const r=this.studio.rig;r.manual=true;r.garageAngle=(r.garageAngle??.85)+dx;r.elevation=Math.max(-1.3,Math.min(1.3,(r.elevation??.45)+dy));}
  magnify(f){const r=this.studio.rig;r.zoom=Math.max(.6,Math.min(2.1,(r.zoom||1)*f));}
  path(start,end,offset=0){const c=this.ctx;c.beginPath();for(let s=start;s<=end+.015;s+=.025){const p=this.track.sample(Math.min(s,end));const x=p.x+p.nx*offset,y=p.y+p.ny*offset-p.z*.45;if(s===start)c.moveTo(x,y);else c.lineTo(x,y);}}
  road(start,end){
    const e=this.track.extraWidth??0,lanes=this.track.lanes.map(l=>this.track.laneOffset(l));
    const c=this.ctx,points=[],step=(end-start)/Math.max(1,Math.ceil((end-start)/.065));
    if(step<=0)return;
    for(let i=0;i<=Math.round((end-start)/step);i++){
      const p=this.track.sample(start+i*step),bank=p.bank||0;
      points.push({...p,py:p.y-p.z*.45,bx:p.nx*Math.cos(bank),
        by:p.ny*Math.cos(bank)+.45*Math.sin(bank),drift:-.041*Math.tanh(2.4*p.curvature)});
    }
    function line(first,last,d,width,color,wear=false){
      c.beginPath();
      for(let i=first;i<=last;i++){
        const p=points[i],offset=d+(wear?p.drift:0)+Math.sign(d)*(p.fork?.offset||0)/2,x=p.x+p.bx*offset,y=p.py+p.by*offset;
        if(i===first)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=color;c.lineWidth=width;c.stroke();
    }
    const metal=c.createLinearGradient(0,this.track.bounds.minY,0,this.track.bounds.maxY);
    metal.addColorStop(0,'#f1e7cf');metal.addColorStop(.28,'#a6adac');
    metal.addColorStop(.52,'#e2e8e3');metal.addColorStop(.76,'#91999b');metal.addColorStop(1,'#d9cbb2');
    function surface(first,last){
      for(const side of [-1,1]){line(first,last,side*(.215+e/2),.43+e,'#777b80');line(first,last,side*(.1865+e/2),.373+e,'#141a20');line(first,last,side*(.175+e/2),.35+e,'#323c43');}
      for(const d of lanes)line(first,last,d+.105,.018,'#65727a55');
      for(const d of lanes){
        for(const tyre of [-.069,.069]){
          line(first,last,d+tyre,.061,'#3e4143',true);
          line(first,last,d+tyre,.025,'#363a3c',true);
        }
        line(first,last,d,.036,'#121518');
        for(const side of [-1,1]){
          const wire=d+side*.026;
          line(first,last,wire,.019,'#262a2d');
          line(first,last,wire,.012,metal);
        }
      }
      for(let i=first;i<last;){
        const next=Math.min(last,i+3);
        if(Math.abs(points[i].curvature)>.05){
          const color=Math.floor(i/3)%2?'#d9cbb1':'#ad5945';
          for(const side of [-1,1])line(i,next,side*(.36+e),.047,color);
        }
        i=next;
      }
      // Opaque graphite/yellow safety rail, also present in compatibility mode.
      for(const side of [-1,1]){
        line(first,last,side*(.433+e),.046,'#172026');
        for(let i=first;i<last;i+=6)line(i,Math.min(last,i+2),side*(.433+e),.030,'#eabd35');
        line(first,last,side*(.444+e),.005,'#d1d4c7');
      }
    }
    surface(0,points.length-1);
    // Repaint only the upper deck at flyovers, whichever branch starts the lap.
    const floor=new Map(),cell=p=>[Math.floor(p.x/.8),Math.floor(p.py/.8)];
    for(const p of points){
      const [x,y]=cell(p),key=x+','+y;floor.set(key,Math.min(floor.get(key)??Infinity,p.z));
    }
    let first=-1;
    for(let i=0;i<=points.length;i++){
      const p=points[i];let above=false;
      if(p&&p.z>.42){
        const [x,y]=cell(p);
        for(let dx=-1;dx<=1&&!above;dx++)for(let dy=-1;dy<=1;dy++)
          if((floor.get((x+dx)+','+(y+dy))??Infinity)<p.z-.65){above=true;break;}
      }
      if(above&&first<0)first=i;
      if(!above&&first>=0){
        if(i-first>1)surface(Math.max(0,first-1),Math.min(points.length-1,i));
        first=-1;
      }
    }
  }
  drawGlints(cars){
    const c=this.ctx;
    for(const car of cars){
      const hit=passageGlint(this.track,this.glintSites,car);
      if(!hit)continue;
      c.save();c.translate(hit.x,hit.z-hit.y*.45);c.rotate(hit.angle);
      const streak=c.createLinearGradient(-.095,0,.095,0);
      streak.addColorStop(0,'rgba(255,242,206,0)');
      streak.addColorStop(.5,'rgba(255,247,223,.94)');
      streak.addColorStop(1,'rgba(255,242,206,0)');
      c.globalAlpha=hit.amount;c.fillStyle=streak;c.fillRect(-.095,-.007,.19,.014);c.restore();
    }
  }
  drawCar(car,alpha=1){if(car.state==='eliminated')return;const p=car.crash??racePose(car,alpha),c=this.ctx;c.save();c.translate(p.x,p.y-p.z*.45);c.rotate(p.angle);if(car.skid>.16){c.strokeStyle='#121719aa';c.lineWidth=.018;for(const side of [-1,1]){c.beginPath();c.moveTo(-.12,side*.06);c.lineTo(-.31,side*.06);c.stroke();}} c.shadowColor='#0008';c.shadowBlur=.07*this.scale;if(car.crash)c.scale(1,.55+.45*Math.abs(Math.cos(car.crash.roll||0)));
    const sprite=!this.garage&&this.studio.raceSprite(car);
    if(sprite){c.drawImage(sprite,-.24,-.16,.48,.32);c.restore();return;}
    const enamel=c.createLinearGradient(0,-.08,0,.08);enamel.addColorStop(0,'#f4f4ca');enamel.addColorStop(.25,car.color);enamel.addColorStop(.72,car.color);enamel.addColorStop(1,'#243039');
    c.fillStyle=enamel;c.beginPath();c.moveTo(.155,-.044);c.quadraticCurveTo(.17,0,.152,.049);c.lineTo(.09,.076);c.lineTo(-.12,.077);c.quadraticCurveTo(-.16,.07,-.15,-.062);c.lineTo(-.11,-.076);c.lineTo(.09,-.074);c.closePath();c.fill();c.shadowBlur=0;c.fillStyle='#162526';c.fillRect(-.07,-.05,.13,.10);c.fillStyle='#151a17';c.fillRect(-.14,-.09,.035,.18);c.fillStyle='#eee8d7';c.fillRect(.115,-.055,.022,.025);c.fillRect(.115,.03,.022,.025);c.restore();}
  landscape(){
    const bitmap = document.createElement('canvas');
    bitmap.width=this.canvas.width; bitmap.height=this.canvas.height;
    const live=this.ctx, c=bitmap.getContext('2d'), b=this.track.bounds;
    this.originX=(bitmap.width-this.scale*(b.minX+b.maxX))/2;
    this.originY=(bitmap.height-this.scale*(b.minY+b.maxY))/2;
    this.ctx=c;
    try {
      c.fillStyle=(THEMES[this.track.theme]??THEMES.forest).ground;
      c.fillRect(0,0,bitmap.width,bitmap.height);
      c.setTransform(this.scale,0,0,this.scale,this.originX,this.originY);
      if(!this.surfaceRequest){
        this.surfaceRequest=dioramaTiles().then(tiles=>{this.dioramaTiles=tiles;this.backdrop=null;this.dirty=true;});
      }
      const tiles=this.dioramaTiles,swatch=tiles?.[groundSwatch(this.track.theme)];
      if(swatch){
        const zoom=2.1/swatch.width;
        c.save();c.scale(zoom,zoom);c.fillStyle=c.createPattern(swatch,'repeat');
        c.fillRect(-this.originX/this.scale/zoom,-this.originY/this.scale/zoom,bitmap.width/this.scale/zoom,bitmap.height/this.scale/zoom);
        c.restore();
      }
      const wash=c.createLinearGradient(b.minX,b.minY,b.maxX,b.maxY);
      wash.addColorStop(0,'#ffdd9127');wash.addColorStop(.44,'#ffe5aa08');wash.addColorStop(1,'#15374750');
      c.fillStyle=wash;c.fillRect(-this.originX/this.scale,-this.originY/this.scale,bitmap.width/this.scale,bitmap.height/this.scale);
      const terrain=createLandscape(this.track);
      let seed=810+this.track.index;
      const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const green=['forest','coast','alpine'].includes(this.track.theme);
      for(let i=0;i<180;i++){
        const x=b.minX-2+random()*(b.maxX-b.minX+4),y=b.minY-2+random()*(b.maxY-b.minY+4);
        const r=.16+random()*(green?.49:.20);
        if(terrain.distance(x,y)<r+.7+(this.track.extraWidth??0))continue;
        if(tiles){
          const kind=this.track.theme==='coast'?(i%4?'palm':'limestone'):this.track.theme==='alpine'?(i%3?'pine':'limestone'):green?(i%4?'oak':'pine'):'limestone';
          const radius=r*(green?1.13:1.35);
          const shadow=c.createRadialGradient(x+radius*.38,y+radius*.47,.001,x+radius*.38,y+radius*.47,radius*1.23);
          shadow.addColorStop(0,'#17201c8c');shadow.addColorStop(.64,'#20272058');shadow.addColorStop(1,'#17201c00');
          c.fillStyle=shadow;c.fillRect(x-radius,y-radius,3*radius,3*radius);
          c.drawImage(tiles[kind],x-radius,y-radius,radius*2,radius*2);
          continue;
        }
        c.fillStyle='#17281e3d';c.beginPath();c.ellipse(x+r*.4,y+r*.45,r,r*.76,.3,0,Math.PI*2);c.fill();
        for(let j=0;j<7;j++){
          const a=j*2.4,dx=x+r*.42*Math.cos(a),dy=y+r*.38*Math.sin(a);
          const g=c.createRadialGradient(dx-r*.22,dy-r*.24,.005,dx,dy,r*.62);
          g.addColorStop(0,green?'#a6ba6c':'#b3a58a');g.addColorStop(.55,green?'#627f48':'#917e62');g.addColorStop(1,green?'#2c4c3b':'#6a6359');
          c.fillStyle=g;c.beginPath();c.arc(dx,dy,r*.62,0,Math.PI*2);c.fill();
        }
      }
      // Ground flecks and scenic structures are baked into the bitmap once per resize.
      for(let i=0;i<2200;i++){
        const x=b.minX-2+random()*(b.maxX-b.minX+4),y=b.minY-2+random()*(b.maxY-b.minY+4);
        c.fillStyle=i%3?'#1419121c':'#f9edc534';
        c.fillRect(x,y,.01+random()*.045,.009+random()*.018);
      }
      const industrial=['harbor','night'].includes(this.track.theme);
      for(let i=0;i<8;i++){
        const at=(i+.4)*this.track.length/8,p=this.track.sample(at);
        const side=i%2?1:-1,x=p.x+side*p.nx*1.7,y=p.y+side*p.ny*1.7;
        if(terrain.distance(x,y)<1.15)continue;
        c.save();c.translate(x,y);c.rotate(Math.atan2(p.ty,p.tx));
        if(industrial){
          for(let j=0;j<2;j++){
            const offset=j*.26;
            c.fillStyle='#182a3399';c.fillRect(-.37,offset-.09,.87,.24);
            c.fillStyle=j?'#a56954':'#69878a';c.fillRect(-.42,offset-.13,.85,.22);
            c.fillStyle='#f6ead733';for(let n=0;n<15;n++)c.fillRect(-.40+n*.055,offset-.12,.014,.19);
          }
        }else if(i%3===0){
          c.fillStyle='#20282070';c.fillRect(-.36,-.18,.88,.57);
          c.fillStyle='#727b74';c.fillRect(-.44,-.28,.88,.28);
          c.fillStyle='#a9a697';c.fillRect(-.44,0,.88,.27);
          c.fillStyle='#d1c9b5';c.fillRect(-.46,-.015,.92,.025);
          c.fillStyle='#614c41';c.fillRect(.18,.03,.11,.1);
        }else{
          c.fillStyle='#ac9778';c.fillRect(-.46,-.014,.92,.028);
          for(const n of [-.45,0,.45]){c.fillStyle='#705b45';c.fillRect(n,-.039,.05,.078);}
        }
        c.restore();
      }
      this.road(0,this.track.length);
      for(const gate of this.track.switches){
        const p=this.track.sample(gate.start);
        for(const lane of this.track.lanes){
          const to=this.track.switchTarget(gate,lane);if(to===lane)continue;
          c.beginPath();for(let i=0;i<=48;i++){const q=this.track.pose(gate.start+(gate.end-gate.start)*i/48,lane,{from:lane,to,start:gate.start,length:gate.end-gate.start});if(i)c.lineTo(q.x,q.y-q.z*.45);else c.moveTo(q.x,q.y-q.z*.45);}c.strokeStyle='#c5d3cf';c.lineWidth=.024;c.stroke();
        }
        c.fillStyle='#e9b365';c.font='.14px monospace';c.fillText('X',p.x,p.y-p.z*.45);
      }
      for(const zone of this.track.conditions??[]){
        for(let i=0;i<30;i++){
          const p=this.track.pose(zone.start+zone.length*i/30,zone.lane);
          c.save();c.translate(p.x,p.y-p.z*.45);c.rotate(p.angle);c.globalAlpha=.68;c.fillStyle=zone.color;
          for(const side of [-1,1])c.fillRect(0,side*.065-.015,.06,.03);c.restore();
        }
        const warn=this.track.sample(zone.start-1.6);c.save();c.translate(warn.x,warn.y-warn.z*.45);c.rotate(Math.atan2(warn.ty,warn.tx));c.fillStyle='#f4d17b';c.fillRect(-.11,.50,.22,.17);c.fillStyle='#242820';c.font='bold .13px sans-serif';c.fillText('!',-.035,.64);c.restore();
      }
      const p=this.track.sample(.08);
      c.translate(p.x,p.y-p.z*.45); c.rotate(Math.atan2(p.ty,p.tx));
      for(let row=0;row<2;row++) for(let cell=0;cell<8;cell++){
        c.fillStyle=(row+cell)%2?'#f5f0d9':'#182127';
        c.fillRect(row*.085,(cell-4)*this.track.width/8,.085,this.track.width/8);
      }
    } finally {this.ctx=live;}
    return bitmap;
  }
  render(session,alpha=1){if(this.track!==session.track){this.track=session.track;this.glintSites=railSites(this.track);this.resize();}if(this.garage){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;if(this.studio.draw(c,w,h,this.preview))return;c.setTransform(1,0,0,1,0,0);c.fillStyle='#152330';c.fillRect(0,0,w,h);c.save();c.translate(w*(w/h<.9?.5:.7),h*(w/h<.9?.22:.5));const size=Math.min(w*.85,h)*1.5;c.scale(size,size);this.drawCar({...session.player,color:this.preview.appearance.paint,pose:{x:0,y:0,z:0,angle:0,tx:1,ty:0},driftAngle:0});c.restore();return;}const key=[session.status,session.mode,session.player.distance,session.player.state].join('|');if(!['running','countdown'].includes(session.status)&&!this.dirty&&this.lastKey===key)return;this.lastKey=key;this.dirty=false;const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.setTransform(1,0,0,1,0,0);if(['chase','drone'].includes(this.view) && ['running','countdown','paused'].includes(session.status)){drawChase(c,this.canvas,session,this.studio,alpha,this.view);return;}this.backdrop??=this.landscape();c.drawImage(this.backdrop,0,0);c.setTransform(this.scale,0,0,this.scale,this.originX,this.originY);if(session.status==='running'&&!this.motion.matches)this.drawGlints(session.cars);session.cars.forEach(a=>this.drawCar(a,alpha)); }
  destroy(){this.resizeObserver.disconnect();this.studio.destroy();}
}
