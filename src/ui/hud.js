import { formatTime } from '../core/math.js';
import { PHYSICS } from '../core/config.js';
const $=id=>document.getElementById(id);
const steps=[['Dai vita alla GT.','Tieni SPAZIO o ACCELERA finché raggiungi 50 km/h. La corsia guida la macchina: tu controlli il gas.'],['La velocità si prepara.','Ora rilascia il gas e lascia fermare la GT. In modalità interruttore premi di nuovo per spegnerlo.'],['Prenota lo scambio.','Tocca SCAMBIO o premi INVIO, poi accelera. La GT cambierà corsia alla prossima X evidenziata.']];
export class HUD {
  constructor(session,profile,input){this.session=session;this.profile=profile;this.input=input;this.last=0;this.tutorialStep=-1;this.cache=new Map();}
  text(id,value){if(this.cache.get(id)!==value){$(id).textContent=value;this.cache.set(id,value);}}
  render(now){if(now-this.last<.065)return;this.last=now;const s=this.session,c=s.player,status=s.status;const menu=status==='ready',finished=['finished','tutorial-complete'].includes(status);
    $('app').dataset.players=s.players.length;$('app').dataset.local=String(s.isLocal);for(const i of [2,3])$('controls-'+i).hidden=s.players.length<i;
    $('garage-open').disabled=!menu&&!finished;$('app').dataset.state=status;$('lobby').hidden=!menu;$('race-hud').hidden=menu||finished;$('pause-panel').hidden=status!=='paused';$('finish-panel').hidden=!finished;$('tutorial').hidden=!s.tutorial||status!=='running';$('countdown').hidden=status!=='countdown';
    this.text('touch-gas-hint',this.input.toggleMode?'TOCCA':'TIENI PREMUTO');this.text('countdown',Math.ceil(s.countdown));this.text('timer',formatTime(s.elapsed));this.text('record',formatTime(this.profile.data.records[s.recordKey]??Infinity));this.text('lap',`${s.mode==='time'?c.laps+1:Math.min(3,c.laps+1)} / ${s.mode==='time'?'∞':'3'}`);this.text('position',`${s.standings().indexOf(c)+1} / ${s.cars.length}`);this.text('speed',String(Math.round(c.speed*3.6*PHYSICS.modelScale)));this.text('wallet',this.profile.data.credits+' CR');
    const danger=c.gripRatio>.9,crashed=c.state==='derailed',skidding=c.skid>.18;$('app').dataset.driving=crashed?'crashed':skidding?'skidding':'grip';$('grip-fill').style.width=Math.min(100,c.gripRatio*100)+'%';$('grip-fill').style.background=c.instability>.5?'#ff4a56':danger?'#ff733e':'#c6f568';this.text('grip-title',skidding?'SBANDATA':'ADERENZA');this.text('grip-label',crashed?'FUORI PISTA':c.instability>.5?'PERDI IL PATTINO!':skidding?'SGOMMA':c.gripRatio>.6?'AL LIMITE':'STABILE');
    const coach=c.coach;$('brake-coach').hidden=!s.guidanceEnabled||!!s.tutorial||s.isLocal||status!=='running';$('brake-coach').dataset.action=coach?.action??'go';this.text('brake-label',coach?.label??'ACCELERA · TROVA IL RITMO');this.text('brake-detail',coach?.action==='brake'?'Lascia SPAZIO / ACCELERA. Il freno motore rallenta la GT.':'Verde: gas · ambra: preparati · rosso: rilascia');
    this.text('guide',crashed?`Rientro in ${c.recoverIn.toFixed(1)} s · poi premi gas`:c.instability>.08||c.skid>.3?'ALZA IL GAS · RECUPERA LA CODA':c.assistanceActive?'FRENO ASSISTITO':s.guidanceEnabled&&coach?coach.label:'GAS IN RETTILINEO · RILASCIO IN CURVA');
    const notice=crashed?'FUORI PISTA · RILASCIA PRIMA DELLA CURVA':s.noticeTTL>0?s.notice:'';this.text('notice',notice);this.text('switch-status',c.change?'CAMBIO CORSIA…':c.switchQueued?`SCAMBIO PRENOTATO · ${s.track.nextSwitchDistance(c.distance).toFixed(1)} m`:`CORSIA ${c.lane+1} · X TRA ${s.track.nextSwitchDistance(c.distance).toFixed(1)} m`);
    for(let i=0;i<s.players.length;i++){const car=s.players[i],suffix=i===0?'':'-'+(i+1);this.text('pilot-speed-'+(i+1),`${Math.round(car.speed*64.8)} km/h`);this.text('pilot-advice-'+(i+1),car.finishedAt!==null?'ARRIVATO':car.state==='derailed'?`RIENTRO ${car.recoverIn.toFixed(1)} s`:s.guidanceEnabled?car.coach?.label??'DAI GAS':car.skid>.18?'SGOMMA · RILASCIA':'DOSA IL GAS');$('controls-'+(i+1)).dataset.action=car.coach?.action??'go';$('throttle'+suffix).classList.toggle('active',!!this.input.states[i].throttle);$('throttle'+suffix).setAttribute('aria-pressed',String(!!this.input.states[i].throttle));$('lane'+suffix).classList.toggle('queued',car.switchQueued||!!car.change);$('lane'+suffix).setAttribute('aria-pressed',String(car.switchQueued));}
    $('lane').classList.toggle('queued',c.switchQueued||!!c.change);$('lane').setAttribute('aria-pressed',String(c.switchQueued));$('throttle').classList.toggle('active',!!this.input.throttle);$('throttle').setAttribute('aria-pressed',String(!!this.input.throttle));
    if(s.tutorial&&this.tutorialStep!==s.tutorial.step&&s.tutorial.step<3){this.tutorialStep=s.tutorial.step;this.text('tutorial-step',`SCUOLA GUIDA / 0${s.tutorial.step+1}`);this.text('tutorial-title',steps[s.tutorial.step][0]);this.text('tutorial-copy',steps[s.tutorial.step][1]);document.querySelectorAll('.tutorial-dots i').forEach((e,i)=>e.classList.toggle('done',i<=s.tutorial.step));}if(!s.tutorial)this.tutorialStep=-1;
    $('rivals').hidden=!!s.tutorial||s.mode==='time';$('race-mode').hidden=!!s.tutorial;this.text('race-mode',s.isLocal?`${s.players.length} PILOTI LOCALI · ${s.assisted?'ASSISTITA':'MANUALE'} · ${s.localFinishAt!==null?'ULTIMI '+Math.max(0,Math.ceil(30-(s.elapsed-s.localFinishAt)))+' S':'STESSO SCHERMO'}`:s.assisted?'ASSISTITA · FRENATA PRUDENTE':'MANUALE · STESSA FISICA PER TUTTI');if(!menu&&!finished){this.minimap();this.rivals();}
  }
  rivals() {
    const s=this.session;
    if(this.raceCars!==s.cars){
      this.raceCars=s.cars;
      $('rivals').innerHTML=s.cars.map(car=>`<div id="pilot-${car.id}" class="rival"><span class="rival-name" style="--car-color:${car.color}"></span><b></b><small></small></div>`).join('');
    }
    const order=s.standings(),leader=order[0];
    order.forEach((car,i)=>{
      const row=$('pilot-'+car.id);row.style.order=i;
      row.querySelector('span').textContent=`${i+1}. ${car.name}`;
      row.querySelector('b').textContent=car.state==='derailed'?`RIENTRO ${car.recoverIn.toFixed(1)}s`:car.finishedAt!==null?'TRAGUARDO':car.skid>.18?'SGOMMA':car.change?'SCAMBIO':'IN PISTA';
      const gap=i===0?'LEADER':car.finishedAt!==null&&leader.finishedAt!==null?`+${(car.finishedAt-leader.finishedAt).toFixed(1)} s`:`+${Math.max(0,leader.distance-car.distance).toFixed(1)} m`;
      row.querySelector('small').textContent=`${gap} · ${car.crashes} ${car.crashes===1?'uscita':'uscite'}`;
      row.dataset.state=car.state==='derailed'?'crashed':car.finishedAt===null&&car.skid>.18?'skidding':'grip';
    });
  }
  minimap(){const s=this.session,c=$('minimap').getContext('2d'),b=s.track.bounds,w=280,h=150,scale=Math.min((w-22)/(b.maxX-b.minX),(h-22)/(b.maxY-b.minY));const xy=p=>[(p.x-(b.minX+b.maxX)/2)*scale+w/2,(p.y-(b.minY+b.maxY)/2)*scale+h/2];c.clearRect(0,0,w,h);c.lineWidth=4;c.strokeStyle='#ffffff75';c.beginPath();for(let i=0;i<=150;i++){const p=xy(s.track.sample(i/150*s.track.length));if(i)c.lineTo(...p);else c.moveTo(...p);}c.stroke();for(const car of s.cars){const p=xy(car.pose);c.fillStyle=car.color;c.beginPath();c.arc(...p,car.ai?3:5,0,Math.PI*2);c.fill();}const [x,y]=xy(s.track.sample(.08));c.fillStyle='#fff';c.fillRect(x-3,y-5,6,10);}
}
