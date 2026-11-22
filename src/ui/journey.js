import { icon } from './icons.js';
import { CHAPTERS,courseName } from '../track/championship.js';
import { openWorld } from '../game/tour.js';
import { formatTime } from '../core/math.js';
const $=id=>document.getElementById(id);
const MODES=[
 ['campaign','arcade','Arcade','Una tessera, dieci mondi. La tua storia al club.'],
 ['time','chrono','Time Trial','Solo tu, tre settori e un tempo da battere.'],
 ['grandprix','trophy','Grand Prix','Quattro auto. Qualifiche e tre giri di gara.'],
 ['elimination','duel','Ultimo rimasto','Dopo 45 secondi esce l’ultimo. Poi ogni 35.'],
 ['local2','wheel','Club locale','Due o tre piloti, fianco a fianco sullo stesso schermo.']
];
export function drawCourse(canvas,track){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const project=p=>({x:(p.x-p.y*.38),y:(p.x*.24+p.y*.62-p.z*1.4)});
 const paths=track.lanes.map(l=>Array.from({length:601},(_,i)=>project(track.pose(i/600*track.length,l))));
 const all=paths.flat(),xs=all.map(p=>p.x),ys=all.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min((w-80)/(maxX-minX),(h-60)/(maxY-minY));
 const xy=p=>[(p.x-(minX+maxX)/2)*scale+w/2,(p.y-(minY+maxY)/2)*scale+h/2];
 c.clearRect(0,0,w,h);
 const haze=c.createRadialGradient(w*.5,h*.55,5,w*.5,h*.55,w*.5);haze.addColorStop(0,'#35605c32');haze.addColorStop(1,'#0b171d00');c.fillStyle=haze;c.fillRect(0,0,w,h);
 c.lineJoin='round';c.lineCap='round';
 const stroke=(points,width,color,dy=0)=>{c.beginPath();points.forEach((p,i)=>{const q=xy(p);q[1]+=dy;i?c.lineTo(...q):c.moveTo(...q);});c.lineWidth=width;c.strokeStyle=color;c.stroke();};
 const thick=Math.max(3,.29*scale);
 for(const points of paths)stroke(points,thick+4,'#0008',8);
 for(const points of paths){stroke(points,thick+1,'#718183');stroke(points,thick-1,'#202e36');stroke(points,.8,'#d7eee9b0');}
 const p=xy(project(track.pose(0,1)));c.fillStyle='#f6b473';c.beginPath();c.arc(...p,5,0,Math.PI*2);c.fill();
 c.font='15px "Slot Sans", sans-serif';c.fillStyle='#d1e8de';c.fillText('START',p[0]+10,p[1]+5);
 c.font='13px "Slot Sans", sans-serif';c.fillStyle='#92afa7';c.fillText('GEOMETRIA DEL CIRCUITO · '+track.laneCount+' CORSIE',24,h-15);
}
export class Journey {
 constructor({session,profile,choose,start,grid,home,restore}){
  Object.assign(this,{session,profile});
  $('mode-choices').innerHTML=MODES.map(([id,symbol,title,copy])=>`<button data-play-mode="${id}" disabled data-boot-disabled>${icon(symbol)}<span><strong>${title}</strong><small>${copy}</small></span></button>`).join('');
  $('mode-choices').addEventListener('click',e=>{const b=e.target.closest('[data-play-mode]');if(b){choose(b.dataset.playMode);this.hideHome();this.animate('lobby');}});
  $('mode-home-button').addEventListener('click',()=>{home();this.showHome();});
  $('restore-arcade').hidden=!profile.hasBackup;
  $('restore-arcade').addEventListener('click',()=>{if(profile.restorePrevious()){restore();this.showHome();$('reset-note').textContent='Progressi precedenti ripristinati. La nuova partita è conservata come copia.';}});
  $('grid-start').addEventListener('click',()=>{$('qualifying-grid').hidden=true;grid();});
  $('grid-skip').addEventListener('click',()=>{session.reset();$('qualifying-grid').hidden=true;home();this.hideHome();});
  const iconButtons={'garage-open':'garage',fullscreen:'fullscreen',sound:'audio','compact-hud':'wheel','audio-settings':'motor','help-open':'spark','pause':'pause','mode-home-button':'arcade','tab-prev':'chevron','tab-next':'chevron'};
  for(const [id,symbol] of Object.entries(iconButtons)){const b=$(id);b.classList.add('round-action');b.setAttribute('aria-label',b.getAttribute('aria-label')||b.textContent);b.title=b.getAttribute('aria-label');b.innerHTML=icon(symbol);}
  $('start').insertAdjacentHTML('afterbegin',icon('play'));
  this.showHome();
 }
 animate(id){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$(id).animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.16,1,.3,1)'});}
 showHome(){$('qualifying-grid').hidden=true;window.scrollTo({top:0,behavior:'instant'});const world=openWorld(this.profile.data.results);$('app').dataset.home='true';$('mode-home').hidden=false;$('home-progress').textContent='CAPITOLO '+(world+1)+' / 10 · '+CHAPTERS[world][0];$('home-continue').textContent=this.profile.data.clubWins?this.profile.data.clubWins+' gare completate · riprendi la tua storia':'Nuova tessera. Prima auto. Tutto da conquistare.';this.animate('mode-home');}
 hideHome(){window.scrollTo({top:0,behavior:'instant'});$('app').dataset.home='false';$('mode-home').hidden=true;}
 refresh(){
  const s=this.session,world=s.meeting?.world;
  $('chapter-title').textContent=world!=null?CHAPTERS[world][0]:MODES.find(m=>m[0]===s.mode)?.[2]||'Il tuo club';
  $('chapter-copy').textContent=world!=null?CHAPTERS[world][1]:MODES.find(m=>m[0]===s.mode)?.[3]||'Scegli il circuito e porta la tua auto in griglia.';
  $('chapter-kicker').textContent=world!=null?'CAPITOLO '+(world+1)+' · GARA '+(s.meeting.round+1)+' / 5':'SESSIONE LIBERA';
  $('qualifying-setting').hidden=!['campaign','grandprix'].includes(s.mode);
  $('start-label').textContent=['campaign','grandprix'].includes(s.mode)&&$('qualifying-enabled').checked?'QUALIFICHE · 2 GIRI':s.mode==='time'?'ENTRA IN PISTA':'IN GRIGLIA';
  drawCourse($('circuit-preview'),s.track);
  $('circuit-preview').setAttribute('aria-label','Anteprima isometrica del circuito '+s.track.level.name);
  this.animate('circuit-preview');
 }
 qualified(){
  const s=this.session;$('qualifying-grid').hidden=false;
  $('grid-results').innerHTML=s.grid.map(p=>`<li class="${p.id==='player'?'is-you':''}"><b>${p.position}</b><span>${p.name}</span><strong>${formatTime(p.time)}</strong></li>`).join('');
  $('grid-track').textContent=s.track.level.name+' · MIGLIOR GIRO SU DUE';this.animate('qualifying-grid');$('grid-start').focus({preventScroll:true});
 }
}
