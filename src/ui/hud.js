import { upcomingSurface } from '../track/conditions.js';
import { trafficAhead,passingLaneClear } from '../game/club.js';
import { formatTime } from '../core/math.js';
import { PHYSICS } from '../core/config.js';
const $=id=>document.getElementById(id);
const steps=[['Dai vita alla GT.','Tieni SPAZIO o ACCELERA finché raggiungi 50 km/h. La corsia guida la macchina: tu controlli il gas.'],['La velocità si prepara.','Ora rilascia il gas e lascia fermare la GT. In modalità interruttore premi di nuovo per spegnerlo.'],['Prenota lo scambio.','Tocca SCAMBIO o premi ESC, poi accelera. La GT cambierà corsia alla prossima X evidenziata.']];
export class HUD {
  constructor(session,profile,input){this.session=session;this.profile=profile;this.input=input;this.last=0;this.tutorialStep=-1;this.cache=new Map();this.plungers=[];this.motion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');}
  text(id,value){if(this.cache.get(id)!==value){$(id).textContent=value;this.cache.set(id,value);}}
  renderPlunger(i,suffix,load,now){
    const count=this.input.states[i].switchCount;
    const dial=this.plungers[i]??={count:0,until:-1,position:''};
    if(count!==dial.count){dial.count=count;dial.until=now+.20;}
    const intervals=this.motion?.matches?2:8;
    const step=Math.round(Math.min(1,Math.max(0,load))*intervals)*8/intervals;
    const position=(step*12.5)+'% '+(now<dial.until?'100%':'0%');
    if(position!==dial.position){$('plunger'+suffix).style.backgroundPosition=position;dial.position=position;}
  }
  render(now){if(now-this.last<.065)return;this.last=now;const s=this.session,c=s.player,status=s.status;const menu=status==='ready',finished=['finished','tutorial-complete'].includes(status);
    $('app').dataset.phase=s.phase;$('app').dataset.mode=s.mode;$('app').dataset.players=s.players.length;$('app').dataset.local=String(s.isLocal);for(const i of [2,3])$('controls-'+i).hidden=s.players.length<i;
    $('garage-open').disabled=!menu&&!finished;$('app').dataset.state=status;$('lobby').hidden=!menu;$('race-hud').hidden=menu||finished||status==='qualified';$('pause-panel').hidden=status!=='paused';$('finish-panel').hidden=!finished;$('tutorial').hidden=!s.tutorial||status!=='running';$('countdown').hidden=status!=='countdown';
    for(const button of document.querySelectorAll('[data-power]'))button.setAttribute('aria-pressed',String(Number(button.dataset.power)===this.input.power[Number(button.dataset.pilot)]));
    for(const slider of document.querySelectorAll('[data-gas-slider]')){const i=Number(slider.dataset.gasSlider),value=Math.round(this.input.power[i]*100);if(Number(slider.value)!==value)slider.value=value;this.text('gas-value-'+i,value+'%');}
    this.text('touch-gas-hint',this.input.toggleMode?'TOCCA':'TIENI PREMUTO');this.text('countdown-value',Math.ceil(s.countdown));
    this.text('grid-name',s.track.level.name.toUpperCase());
    const lamps=Math.min(5,1+Math.floor((3-s.countdown)*2));
    for(const [i,lamp] of document.querySelectorAll('.start-lights i').entries())lamp.classList.toggle('on',i<lamps);
    const surface=upcomingSurface(s.track,c);$('surface-warning').hidden=!surface||status!=='running'||!!s.tutorial;
    if(surface){$('surface-warning').dataset.affected=String(surface.affected);this.text('surface-warning',surface.label+' · CORSIA '+(surface.lane+1)+(surface.inside?' · '+(surface.affected?'RILASCIA IL GAS':'CORSIA LIBERA'):' · '+Math.ceil(surface.distance)+' M'));}
    this.text('timer',formatTime(s.elapsed));this.text('record',formatTime(this.profile.data.records[s.recordKey]??Infinity));this.text('lap',`${s.mode==='time'||s.mode==='elimination'?c.laps+1:Math.min(s.phase==='qualifying'?2:3,c.laps+1)} / ${s.mode==='time'||s.mode==='elimination'?'∞':s.phase==='qualifying'?'2':'3'}`);this.text('position',`${s.standings().indexOf(c)+1} / ${s.cars.length}`);this.text('model-speed',c.speed.toFixed(1)+' m/s');this.text('speed',String(Math.round(c.speed*3.6*PHYSICS.modelScale)));this.text('wallet',this.profile.data.credits+' CR');
    this.text('map-speed',String(Math.round(c.speed*3.6*PHYSICS.modelScale)));
    const risk=c.state==='derailed'?'In recupero':c.skid>.18?'Sbandata':c.coach?.action==='brake'||c.gripRatio>.78?'Rilascia il gas':'Stabile';
    const jump=s.track.jump,remaining=jump?(jump.start-c.pose.s+s.track.length)%s.track.length:Infinity;
    this.text('map-risk',remaining<8?'SALTO · 155 km/h':risk);$('map-risk').dataset.warn=String(remaining<8||risk!=='Stabile');
    const danger=c.gripRatio>.9,crashed=c.state==='derailed',skidding=c.skid>.18;$('app').dataset.driving=crashed?'crashed':skidding?'skidding':'grip';$('grip-fill').style.width=Math.min(100,c.gripRatio*100)+'%';$('grip-fill').style.background=c.instability>.5?'#ff4a56':danger?'#ff733e':'#c6f568';this.text('grip-title',skidding?'RECUPERA LA CODA':'ADERENZA');this.text('grip-label',crashed?'FUORI PISTA':c.instability>.5?'PERDI IL PATTINO!':skidding?'SGOMMA':c.gripRatio>.6?'AL LIMITE':'STABILE');
    if(crashed)$('notice').style.setProperty('--recovery-progress',String(Math.max(0,Math.min(1,1-c.recoverIn/PHYSICS.recoverySeconds))));
    const coach=c.coach;$('brake-coach').hidden=!s.guidanceEnabled||!!s.tutorial||s.isLocal||status!=='running';$('brake-coach').dataset.action=coach?.action??'go';this.text('brake-label',coach?.label??'ACCELERA · TROVA IL RITMO');this.text('brake-detail',coach?.action==='brake'?'Lascia SPAZIO / ACCELERA. Il freno motore rallenta la GT.':'Verde: gas · ambra: preparati · rosso: rilascia');
    this.text('guide',crashed?`Rientro in ${c.recoverIn.toFixed(1)} s · poi premi gas`:c.instability>.08||c.skid>.3?'ALZA IL GAS · RECUPERA LA CODA':c.assistanceActive?'FRENO ASSISTITO':s.guidanceEnabled&&coach?coach.label:'GAS IN RETTILINEO · RILASCIO IN CURVA');
    const passing=s.meeting && trafficAhead(s.track,c,s.cars)<2.4 && s.track.nextSwitchDistance(c.distance)<3;
    this.text('lane-cue',s.meeting && c.switchQueued?'PRENOTATO':passing && passingLaneClear(s.track,c,s.cars)?'SORPASSA':'SCAMBIO');
    const notice=crashed?(c.crash.shortJump?'SALTO CORTO · SERVONO 155 KM/H':c.crash.hit?'CONTATTO TRA VETTURE':c.crash.wallHits?'CONTATTO COL GUARDRAIL':c.recoverIn<.8?'RIENTRO IN CORSIA':'FUORI PISTA'):s.noticeTTL>0?s.notice:'';this.text('notice',notice);this.text('switch-status',c.change?'CAMBIO CORSIA…':c.switchQueued?`SCAMBIO PRENOTATO · ${s.track.nextSwitchDistance(c.distance).toFixed(1)} m`:`CORSIA ${c.lane+1} / ${s.track.laneCount} · X TRA ${s.track.nextSwitchDistance(c.distance).toFixed(1)} m`);
    for(let i=0;i<s.players.length;i++){const car=s.players[i],suffix=i===0?'':'-'+(i+1);this.renderPlunger(i,suffix,car.throttle,now);this.text('pilot-speed-'+(i+1),`${Math.round(car.speed*3.6)} km/h modello`);this.text('pilot-advice-'+(i+1),car.finishedAt!==null?'ARRIVATO':car.state==='derailed'?`RIENTRO ${car.recoverIn.toFixed(1)} s`:s.guidanceEnabled?car.coach?.label??'DAI GAS':car.skid>.18?'SGOMMA · RILASCIA':'DOSA IL GAS');$('controls-'+(i+1)).dataset.action=car.coach?.action??'go';$('throttle'+suffix).classList.toggle('active',!!this.input.states[i].throttle);$('throttle'+suffix).setAttribute('aria-pressed',String(!!this.input.states[i].throttle));$('lane'+suffix).classList.toggle('queued',car.switchQueued||!!car.change);$('lane'+suffix).setAttribute('aria-pressed',String(car.switchQueued));}
    $('lane').classList.toggle('queued',c.switchQueued||!!c.change);$('lane').setAttribute('aria-pressed',String(c.switchQueued));$('throttle').classList.toggle('active',!!this.input.throttle);$('throttle').setAttribute('aria-pressed',String(!!this.input.throttle));
    if(s.tutorial&&this.tutorialStep!==s.tutorial.step&&s.tutorial.step<3){this.tutorialStep=s.tutorial.step;this.text('tutorial-step',`SCUOLA GUIDA / 0${s.tutorial.step+1}`);this.text('tutorial-title',steps[s.tutorial.step][0]);this.text('tutorial-copy',steps[s.tutorial.step][1]);document.querySelectorAll('.tutorial-dots i').forEach((e,i)=>e.classList.toggle('done',i<=s.tutorial.step));}if(!s.tutorial)this.tutorialStep=-1;
    $('rivals').hidden=!!s.tutorial||s.mode==='time';$('race-mode').hidden=!!s.tutorial;this.text('race-mode',s.phase==='qualifying'?(c.finishedAt!==null?'QUALIFICHE · ATTENDI GLI ALTRI PILOTI':'QUALIFICHE · 2 GIRI · NESSUN CONTATTO'):s.mode==='elimination'?'ELIMINAZIONE TRA '+Math.ceil(s.nextElimination-s.elapsed)+' S':s.isLocal?`${s.players.length} PILOTI LOCALI · ${s.assisted?'ASSISTITA':'MANUALE'} · ${s.localFinishAt!==null?'ULTIMI '+Math.max(0,Math.ceil(30-(s.elapsed-s.localFinishAt)))+' S':'STESSO SCHERMO'}`:s.assisted?'ASSISTITA · FRENATA PRUDENTE':'MANUALE · STESSA FISICA PER TUTTI');this.renderSectors(!menu && !finished && !s.tutorial ? s.sectors : null);
    if(!menu&&!finished){if($('minimap').offsetWidth)this.minimap();if(!$('rivals').hidden && $('rivals').offsetWidth)this.rivals();}
  }
  renderSectors(clock) {
    $('sectors').hidden = !clock;
    if (!clock) {
      this.sectorClock = null;
      this.text('sector-announcement', '');
      return;
    }
    if (clock === this.sectorClock && clock.completed === this.sectorsCompleted) return;
    this.sectorClock = clock;
    this.sectorsCompleted = clock.completed;
    for (let index = 0; index < 3; index++) {
      const number = index + 1;
      const split = clock.last[index];
      const delta = split?.delta;
      const comparison = delta == null ? (split ? 'Riferimento' : '—')
        : Math.abs(delta) < .0005 ? 'Pari' : (delta < 0 ? '−' : '+') + Math.abs(delta).toFixed(3).replace('.', ',') + ' s';
      this.text('sector-name-' + number, 'S' + number + (clock.current === index ? ' · in corso' : ''));
      this.text('sector-time-' + number, split ? split.duration.toFixed(3).replace('.', ',') + ' s' : '—');
      this.text('sector-gap-' + number, comparison);
      if (clock.completed && index === (clock.completed - 1) % 3) {
        this.text('sector-announcement', 'Settore ' + number + ', ' + split.duration.toFixed(3).replace('.', ',') + ' secondi. ' + comparison);
      }
    }
  }
  rivals() {
    const s=this.session;
    if(this.raceCars!==s.cars){
      this.raceCars=s.cars;
      $('rivals').innerHTML=s.cars.map(car=>`<div id="pilot-${car.id}" class="rival"><span class="rival-name" style="--car-color:${car.color}"></span><b></b><small></small></div>`).join('');
    }
    const order=s.phase==='qualifying'?[...s.cars].sort((a,b)=>a.bestLap-b.bestLap||b.distance-a.distance):s.standings(),leader=order[0];
    order.forEach((car,i)=>{
      const row=$('pilot-'+car.id);row.style.order=i;
      row.querySelector('span').textContent=`${i+1}. ${car.name}`;
      row.querySelector('b').textContent=car.state==='derailed'?`RIENTRO ${car.recoverIn.toFixed(1)}s`:car.finishedAt!==null?'TRAGUARDO':car.skid>.18?'SGOMMA':car.change?'SCAMBIO':'IN PISTA';
      const gap=s.phase==='qualifying'?(Number.isFinite(car.bestLap)?formatTime(car.bestLap):'GIRO DI LANCIO'):i===0?'LEADER':car.finishedAt!==null&&leader.finishedAt!==null?`+${(car.finishedAt-leader.finishedAt).toFixed(1)} s`:`+${Math.max(0,leader.distance-car.distance).toFixed(1)} m`;
      row.querySelector('small').textContent=`${gap} · ${car.crashes} ${car.crashes===1?'uscita':'uscite'}`;
      row.dataset.state=car.state==='derailed'?'crashed':car.finishedAt===null&&car.skid>.18?'skidding':'grip';
    });
  }
  minimap(){const s=this.session,c=$('minimap').getContext('2d'),b=s.track.bounds,w=280,h=150,scale=Math.min((w-22)/(b.maxX-b.minX),(h-22)/(b.maxY-b.minY));const xy=p=>[(p.x-(b.minX+b.maxX)/2)*scale+w/2,(p.y-(b.minY+b.maxY)/2)*scale+h/2];c.clearRect(0,0,w,h);c.lineWidth=4;c.strokeStyle='#ffffff75';if(this.mapTrack!==s.track){
      this.mapTrack=s.track;this.mapPath=new Path2D();
      for(let i=0;i<=300;i++){const p=xy(s.track.sample(i/300*s.track.length));if(i)this.mapPath.lineTo(...p);else this.mapPath.moveTo(...p);}
    }
    c.strokeStyle='#d7e4ef';c.stroke(this.mapPath);for(const car of s.cars){const p=xy(car.crash??car.pose);c.fillStyle=car.color;c.beginPath();c.arc(...p,car.ai?3:5,0,Math.PI*2);c.fill();}const [x,y]=xy(s.track.sample(.08));c.fillStyle='#fff';c.fillRect(x-3,y-5,6,10);}
}
