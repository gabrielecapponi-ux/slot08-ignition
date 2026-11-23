import { WEATHER } from './track/weather.js';
import {raceId} from './game/tour.js';
import {installGraphics} from './ui/graphics.js';
import { Journey } from './ui/journey.js';
import { icon } from './ui/icons.js';
import { courseName } from './track/championship.js';
import { afterEffectsScript } from './motion/after-effects.js';
import { MEETINGS, meetingGoal } from './game/club.js';
import { FLEET,WORLDS,STAR_GATE,worldStars,openWorld,nextCampaignRace } from './game/tour.js';
import { RaceSession } from './game/session.js';
import { Profile } from './game/profile.js';
import { FixedLoop } from './core/loop.js';
import { InputController } from './input/controller.js';
import { SoundEngine } from './audio/sound.js';
import { HUD } from './ui/hud.js';
import { installScreenControls } from './ui/screen.js';
import { Workshop } from './ui/workshop.js';
import { LEVELS, createTrack } from './track/catalog.js';
import { formatTime } from './core/math.js';
const $=id=>document.getElementById(id);let local;try{local=window.localStorage;}catch{}
const profile=new Profile(local),sound=new SoundEngine();let journey;profile.beginNewArcadeOnce();let raceEvents=[];let input,loop,renderer,view='chase',graphics3D=false;
const session=new RaceSession({onEvent:e=>{
  if(e.type==='reset')raceEvents=[];
  if(['start','derail','contact','lap','finish'].includes(e.type)&&raceEvents.length<256)raceEvents.push({type:e.type,time:e.type==='start'?0:3+session.elapsed,name:e.car?.name||'GARA'});
  if(e.type==='lap'&&e.car===session.player&&!session.isLocal){const record=profile.record(session.recordKey,e.lap);session.toast((record?'NUOVO RECORD · ':'GIRO COMPLETATO · ')+formatTime(e.lap)+(e.clean?' · +35 CR':'') );sound.event('lap');}
  if(e.type==='derail'){if(!e.car.ai)input?.clear(session.players.indexOf(e.car));else session.toast(e.car.name.toUpperCase()+' FUORI PISTA · 3 S DI RECUPERO');}
  if(e.type==='respawn'&&!e.car.ai)session.toast('IN PISTA · PREMI DI NUOVO IL GAS');
  if(['pause','reset','finish','tutorial-complete'].includes(e.type))input?.clear();
  if(e.type==='contact'){if(sound.context&&sound.active)sound.impact(.5);session.toast('CONTATTO · '+e.car.name+' / '+e.other.name);}
  if(['beep','tutorial-step'].includes(e.type))sound.beep(e.go);if(e.type==='switch')sound.event('switch');
  if(e.type==='qualified'){input?.clear();journey?.qualified();}
  if(e.type==='finish'){sound.event('finish');session.reward=profile.complete(session);finish(false);presentResult();}
  if(e.type==='tutorial-complete'){profile.data.tutorial=true;profile.save();finish(true);}
}});
session.rivalRating=profile.data.rivalRating;session.tuning=profile.vehicle.tuning;session.configure({upgrades:profile.data.upgrades,appearance:profile.data.appearance});
const focus=()=>$('game').focus({preventScroll:true});
const pause=()=>{input?.clear();session.status==='paused'?session.resume():session.pause();};
const status=text=>$('scene-status').textContent=text;
let canvas=$('game');
try{if(new URLSearchParams(location.search).get('renderer')==='2d')throw Error('2D requested');const {Scene3D}=await import('./render/scene3d.js');renderer=new Scene3D(canvas,session.track,{onStatus:status,onLost:()=>{session.pause();status('GRAFICA SOSPESA');$('poster').hidden=false;},onRestored:()=>{$('poster').hidden=true;status('3D RIPRISTINATO');}});graphics3D=true;}
catch(e){console.warn('Canvas fallback',e);const copy=canvas.cloneNode(true);canvas.replaceWith(copy);canvas=copy;const {Canvas2D}=await import('./render/canvas2d.js');renderer=new Canvas2D(canvas,session.track,{onStatus:status});}
const cameras={chase:'Da dietro',drone:'Drone',macro:'Frontale GT',rail:'Bordo pista',iso:'Panoramica',top:'Dall’alto'};
const availableViews=graphics3D?Object.keys(cameras):['chase','drone','top'];
const selector=$('race-camera');
for(const mode of Object.keys(cameras)){
  if(availableViews.includes(mode))selector.add(new Option(cameras[mode],mode));
  else {$('view-'+mode).disabled=true;$('pause-view').querySelector(`option[value="${mode}"]`).disabled=true;}
}
let preferred='chase';
try{const saved=local?.getItem('slot08.camera');if(availableViews.includes(saved))preferred=saved;}catch{}
const setView=(v,remember=false)=>{
  view=availableViews.includes(v)?v:'chase';renderer.setView(view);selector.value=view;
  for(const mode of Object.keys(cameras))$('view-'+mode).setAttribute('aria-pressed',String(mode===view));
  if(remember){preferred=view;try{local?.setItem('slot08.camera',view);}catch{}}
};
selector.addEventListener('change',()=>{setView(selector.value,true);focus();});
const cycle=()=>setView(availableViews[(availableViews.indexOf(view)+1)%availableViews.length],true);
input=new InputController({canvas,throttle:$('throttle'),lane:$('lane'),toggle:$('toggle-throttle'),extra:[2,3].map(i=>({throttle:$('throttle-'+i),lane:$('lane-'+i)})),onPause:pause,onActivity:()=>{},onCamera:cycle,isDriving:()=>['running','countdown'].includes(session.status)});
const hud=new HUD(session,profile,input),abort=new AbortController(),on=(node,event,fn)=>node.addEventListener(event,fn,{signal:abort.signal});
const graphics=installGraphics({renderer,storage:local,pause:()=>{input.clear();session.pause();},signal:abort.signal});
const screenControls = installScreenControls({
  button: $('fullscreen'), help: $('screen-help'), close: $('screen-help-close'),
  onPause: () => { input.clear(); session.pause(); }, signal: abort.signal
});
function startScreen() {
  if (window.matchMedia('(pointer: coarse)').matches) void screenControls.enter(false);
}
import {SECTORS,drawSector,worldIcon} from './track/sectors.js';
const routeIcons=new Map();
function trackIcon(index,variant=-1){const key=index+':'+variant;if(routeIcons.has(key))return routeIcons.get(key);const t=createTrack(index,{lanes:4,variant}),b=t.bounds;const points=Array.from({length:110},(_,i)=>{const p=t.sample(i/109*t.length);return`${((p.x-b.minX)/(b.maxX-b.minX)*60).toFixed(1)},${((p.y-b.minY)/(b.maxY-b.minY)*38).toFixed(1)}`;}).join(' ');const svg=`<svg viewBox="0 0 60 38" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${LEVELS[index].color}" stroke-width="3" stroke-linejoin="round"/></svg>`;routeIcons.set(key,svg);return svg;}
function enterClub(){
  const world=openWorld(profile.data.results),first=WORLDS[world][1].findIndex((_,i)=>(profile.data.results[raceId(world,i)]||0)<2);
  session.carIndex=profile.data.car;
  session.clubRound=raceId(world,Math.max(0,first));
  session.reset('campaign');
}
function presentResult(){
  const r=session.reward;
  if(!r)return;
  $('finish-stars').innerHTML=Array.from({length:3},(_,i)=>`<span class="${i<r.stars?'earned':''}" style="--star-delay:${.25+i*.22}s">★</span>`).join('');
  $('finish-panel').dataset.rank=String(r.rank);
  const stars=session.meeting?worldStars(profile.data.results,session.meeting.world):r.stars;
  $('finish-progress').innerHTML=session.meeting?`<div><span>MONDO ${session.meeting.world+1} · ${r.gainedStars?`+${r.gainedStars} stelle · +${r.gainedStars*40} CR`:'risultato registrato'}${r.surfaceBonus?' · Podio tecnico +75 CR':''}</span><b>${stars} / ${STAR_GATE}</b></div><meter min="0" max="${STAR_GATE}" value="${Math.min(STAR_GATE,stars)}">${stars} stelle</meter>`:'';
  $('finish-unlock').textContent=r.unlockedCars.length?'SBLOCCATA · '+r.unlockedCars.join(' / '):r.newWorld?'NUOVO MONDO APERTO':r.rank===1?'VITTORIA · IL CLUB SI RICORDERÀ DI QUESTO GIRO.':session.player.crashes?'Un giro più pulito vale una stella in più.':'Torna in pista per conquistare il primo posto.';
}
function menu(){
  const event=session.meeting,unlocked=openWorld(profile.data.results);
  const passportWorld=event?.world??unlocked,earned=worldStars(profile.data.results,passportWorld),nextCar=FLEET.find(c=>c.world>unlocked);
  $('tour-passport').innerHTML=`<div><span>LICENZA DI CLUB</span><strong>MONDO ${passportWorld+1} / 10</strong></div><p>${WORLDS[passportWorld][0]}</p><meter min="0" max="${STAR_GATE}" value="${Math.min(STAR_GATE,earned)}">${earned} stelle</meter><small>${earned} stelle · ${Math.max(0,STAR_GATE-earned)} alla promozione${nextCar?' · prossima auto: '+nextCar.name:''}</small>`;
  $('route-preview').innerHTML=trackIcon(session.level,session.meeting?session.clubRound:-1);$('track-length').dataset.lanes=session.track.laneCount;
  $('track-condition').textContent=session.track.conditions.length?session.track.conditions.map(z=>z.short+' · corsia '+(z.lane+1)).join(' / '):'Fondo pulito · cerca il punto di frenata';
  $('track-condition').textContent=WEATHER[session.track.weather].label+' · '+$('track-condition').textContent;
  if(event&&session.hazards&&session.track.conditions.length)$('track-condition').textContent+=' · Podio senza uscite +75 CR';
  $('rival-development').hidden=!event;$('rival-development').textContent=event?'Scuderie rivali · '+session.cars.filter(c=>c.ai).map(c=>c.name+' Lv.'+c.upgrades.motor).join(' / '):'';
  $('club-event').hidden=!event;
  $('world-picker').hidden=!event;
  $('world-atlas').hidden=!event;$('map-stage').hidden=!event;
  if(event){
    const world=event.world,stars=worldStars(profile.data.results,world);
    const [title,accent]=SECTORS[world];
    $('map-stage').textContent='M'+(world+1)+' · GARA '+(event.round+1)+'/10';
    const banner=$('atlas-art');if(banner.dataset.world!==String(world)){
      drawSector(banner.getContext('2d'),banner.width,banner.height,world);banner.dataset.world=world;
    }
    $('world-atlas').style.setProperty('--sector',accent);
    $('atlas-world').textContent='Mondo '+(world+1)+' / 10 · '+title;
    $('atlas-next').textContent=(world<9?'Prossimo mondo · '+SECTORS[world+1][0]+' · '+Math.min(stars,STAR_GATE)+'/'+STAR_GATE+' stelle':'Ultimo mondo')+' · Gara '+(event.round+1)+' di 10';
    $('atlas-stops').innerHTML=SECTORS.map(([name,color],i)=>`<button data-world="${i}" aria-label="Mondo ${i+1}: ${name}${i>unlocked?' bloccato':''}" ${i>unlocked?'disabled':''} aria-pressed="${world===i}" style="--dot:${color}">${worldIcon(i)}${String(i+1).padStart(2,'0')}</button>`).join('');
    $('world-picker').innerHTML=WORLDS.map(([name],i)=>`<option value="${i}" ${i>unlocked?'disabled':''} ${world===i?'selected':''}>${i+1} · ${name}${i>unlocked?' · bloccato':''}</option>`).join('');
    $('club-event').textContent='Gara '+(event.round+1)+'/10 · '+stars+'/30 stelle · 2 stelle per avanzare'+(world<9?' · prossimo mondo a '+STAR_GATE+' stelle':' · finale del tour');
    $('club-calendar').innerHTML=WORLDS[world][1].map((level,i)=>{
      const id=raceId(world,i),n=profile.data.results[id],locked=i>0&&profile.data.results[raceId(world,i-1)]<2;return `<li class="${id===session.clubRound?'current':''}"><button data-round="${id}" ${locked?'disabled':''} aria-pressed="${id===session.clubRound}">${trackIcon(level,id)}<span class="route-state">${locked?'Bloccata':id===session.clubRound?'In griglia':n?'Completata':'Disponibile'}</span><small>GARA ${i+1} · ${'★'.repeat(n)+'☆'.repeat(3-n)}</small><strong>${courseName(id)}</strong><span>Motore consigliato · Lv. ${world+Math.floor((i+1)/3)}</span></button></li>`;
    }).join('');
  }
  $('level-list').hidden=!!event;$('free-circuits').hidden=!!event;$('club-calendar').hidden=!event;
  input.configure(session.players.length);$('local-help').hidden=!session.isLocal;$('coach-setting').value=session.guidance;const level=session.track.level;$('track-name').textContent=level.name;$('track-subtitle').textContent=level.subtitle;$('track-length').textContent=Math.round(session.track.length)+' M · '+session.track.laneCount+' CORSIE';$('footer-track').textContent=String(session.level+1).padStart(2,'0')+' — '+level.name.toUpperCase();$('mode').value=session.mode;$('difficulty').value=session.difficulty;$('assist').checked=session.assisted;$('hazards').checked=session.hazards;$('first-run').hidden=false;
  journey?.refresh();
  if(!event)$('level-list').innerHTML=LEVELS.map((l,i)=>`<button class="level-card" data-level="${i}" aria-pressed="${i===session.level}">${trackIcon(i)}<span><small>${l.tag}</small><strong>${l.name}</strong></span><span class="badge">${profile.data.medals[i]?'★'.repeat(profile.data.medals[i]):'↗'}</span></button>`).join('');
}
let advance = null;
function startRound(round) {
  if (session.status !== 'finished') return;
  advance = null;
  if (round === null) { returnToPits(); return; }
  session.clubRound = round;
  session.reset('campaign');menu();journey?.hideHome();journey?.animate('lobby');
  advance={brief:true,round,label:($('qualifying-enabled').checked?'Qualifiche':'Partenza')+' · '+courseName(round),seconds:6,last:null};
}

function updateAdvance(now) {
  if (!advance) return;
  if (document.hidden || !document.hasFocus() || document.querySelector('dialog[open], .studio-export[open]')) {
    advance.last = null;
    return;
  }
  if (advance.last !== null) advance.seconds -= Math.min(.25, now - advance.last);
  advance.last = now;
  const seconds = Math.max(0, Math.ceil(advance.seconds));
  const message = advance.label + ' tra ' + seconds + ' s';
  if ($('auto-start-note').textContent !== message) $('auto-start-note').textContent = message;
  if(advance.brief){$('first-run').textContent=message+' · oppure scegli IN GRIGLIA';if(seconds===0)begin();}else if(seconds===0)startRound(advance.round);
}
function begin(refreshMenu=false){advance=null;journey?.hideHome();input.clear();session.rivalRating=profile.data.rivalRating;session.reset($('mode').value);menu();if($('qualifying-enabled').checked&&['campaign','grandprix'].includes(session.mode))session.beginQualifying();else session.start();setView(session.isLocal?'top':preferred);focus();window.scrollTo({top:0,behavior:'instant'});}
function back(){input.clear();session.reset($('mode').value);menu();loop?.resetClock();}
function finish(tutorial){
  advance = null;
  $('next-level').hidden = false;
  $('retry-round').hidden = true;
  $('auto-start-note').hidden = true;
  $('finish-progress').textContent='';$('finish-unlock').textContent='';
  if(session.isLocal){const order=session.standings();$('finish-kicker').textContent='GARA LOCALE · STESSO SCHERMO';$('finish-title').textContent=order[0].name+' vince!';$('finish-stars').textContent='🏁';$('finish-summary').textContent=order.map((c,i)=>`${i+1}° ${c.name} · ${c.finishedAt===null?'non arrivato':formatTime(c.finishedAt)} · ${c.crashes} uscite`).join('\n');$('finish-reward').textContent='Stessa macchina e stessa fisica per tutti.';$('next-level').textContent='RIVINCITA';return;}const r=session.reward;$('finish-kicker').textContent=tutorial?'SCUOLA GUIDA COMPLETATA':session.track.level.name.toUpperCase();$('finish-title').textContent=tutorial?'Ora sei al volante.':r.rank===1?'Il podio è tuo.':'Ogni giro conta.';$('finish-stars').textContent=tutorial?'✓':'★'.repeat(r.stars)+'☆'.repeat(3-r.stars);$('finish-summary').textContent=tutorial?'Gas, rilascio, scambio: hai provato tutti i comandi.':`${r.rank}° posto · ${formatTime(session.elapsed)} · ${session.player.crashes} uscite`;$('finish-reward').textContent=tutorial?'La prima gara ti aspetta.':`+${r.credits} CR${r.unlocked?' · TAPPA SUCCESSIVA RAGGIUNTA':''}`;if(session.meeting){
    $('finish-reward').textContent='+'+r.credits+' CR · saldo '+profile.data.credits+' CR · '+worldStars(profile.data.results,session.meeting.world)+'/30 stelle nel mondo';
    const round = nextCampaignRace(session.clubRound,profile.data.results);
    const replay = round === session.clubRound;
    const label = round === null ? 'Rientro ai box' : (replay ? 'Rivincita' : 'Partenza') + ' · ' + courseName(round);
    $('finish-title').textContent = round === null ? 'Campionato concluso' : replay ? 'Serve la seconda stella' : 'Gara completata!';
    $('next-level').textContent = round === null ? 'TORNA AI BOX' : replay ? 'RIPROVA ORA' : 'PARTI ORA';
    $('next-level').hidden = round === null;
    $('retry-round').hidden = replay;
    $('auto-start-note').hidden = false;
    $('auto-start-note').textContent = label + ' tra 8 s';
    advance = {round,label,seconds:8,last:null};
    return;
  }
  $('next-level').textContent=tutorial?'LA MIA PRIMA GARA':session.level<LEVELS.length-1?'PROSSIMO CIRCUITO':'CORRI ANCORA';}
on($('level-list'),'click',e=>{session.mixCourse=null;const button=e.target.closest('[data-level]');if(button){session.configure({level:Number(button.dataset.level)});menu();window.scrollTo({top:0,behavior:'smooth'});}});
function selectRound(id){advance=null;if(Number.isInteger(id)&&MEETINGS[id]?.world<=openWorld(profile.data.results)&&(MEETINGS[id].round===0||profile.data.results[raceId(MEETINGS[id].world,MEETINGS[id].round-1)]>=2)){session.clubRound=id;session.reset('campaign');menu();}}
on($('atlas-stops'),'click',e=>{const b=e.target.closest('[data-world]');if(b)selectRound(Number(b.dataset.world)*5);});
on($('world-picker'),'change',()=>selectRound(Number($('world-picker').value)*5));
on($('lobby-nav'),'click',e=>{
  const target=e.target.closest('[data-target]')?.dataset.target;
  if(!target)return;
  const el=$(target==='club-calendar' && !session.meeting?'level-list':target);
  const control=el.querySelector('button:not(:disabled), select')??el;
  control.focus({preventScroll:true});el.scrollIntoView({block:'start'});
});
on($('club-calendar'),'click',e=>{const b=e.target.closest('[data-round]');if(b){selectRound(Number(b.dataset.round));$('start').focus({preventScroll:true});$('start').scrollIntoView({block:'center'});}});
const workshop=new Workshop(profile,session,renderer,menu);
journey=new Journey({session,profile,choose:(mode,featured)=>{session.mixCourse=null;if(mode==='featured'){session.mixCourse=featured;session.level=MEETINGS[featured].level;session.reset('grandprix');}else if(mode==='mix'){
  if(!session.courseBag?.length){session.courseBag=Array.from({length:MEETINGS.length},(_,i)=>i);for(let i=session.courseBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[session.courseBag[i],session.courseBag[j]]=[session.courseBag[j],session.courseBag[i]];}}
  session.mixCourse=session.courseBag.pop();session.level=MEETINGS[session.mixCourse].level;session.reset('grandprix');
}else if(mode==='campaign')enterClub();else session.reset(mode);menu();},grid:()=>{input.clear();session.startGrid();setView(preferred);focus();startAudio();},home:()=>{advance=null;input.clear();session.reset();menu();},restore:()=>{session.configure({upgrades:profile.data.upgrades,appearance:profile.data.appearance});enterClub();menu();}});
on($('qualifying-enabled'),'change',()=>journey.refresh());
for(const kind of ['pointerdown','keydown'])on($('lobby'),kind,()=>{if(advance?.brief){advance=null;$('first-run').textContent='Scegli il tuo assetto, poi entra in pista.';}});
for(const v of Object.keys(cameras))on($('view-'+v),'click',()=>{setView(v,true);focus();});
on($('export-ae'),'click',()=>{
 const data=afterEffectsScript({vehicle:FLEET[profile.data.car].name,upgrades:profile.data.upgrades,track:session.track.level.name,lanes:session.track.laneCount,duration:session.elapsed,events:raceEvents,...(session.reward||{})});
 const url=URL.createObjectURL(new Blob([data],{type:'text/javascript;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='SLOT08-gara-after-effects.jsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
 $('export-ae-note').textContent='File JSX scaricato. Sul Mac: After Effects → File → Script → Esegui file di script.';
});
on($('start'),'click',()=>{startAudio();startScreen();if(!profile.data.tutorial&&session.mode==='race'&&session.level===0){input.configure(1);session.beginTutorial();menu();setView(preferred);focus();window.scrollTo(0,0);}else begin();});
on($('tutorial-start'),'click',()=>{startAudio();startScreen();input.configure(1);session.beginTutorial();menu();setView(preferred);focus();window.scrollTo(0,0);});
on($('tutorial-skip'),'click',()=>{profile.data.tutorial=true;profile.save();session.reset('race');$('mode').value='race';begin();});
on($('next-level'),'click',()=>{if(session.meeting){if(advance)startRound(advance.round);return;}if(session.isLocal){begin();return;}const tutorial=session.status==='tutorial-complete';session.level=tutorial?0:Math.min(LEVELS.length-1,session.level+1);$('mode').value=session.mode==='grandprix'?'grandprix':'race';begin();});
on($('retry-round'),'click',()=>startRound(session.clubRound));
function returnToPits() {
  advance = null;
  const campaign = !!session.meeting;
  if (campaign) enterClub();
  else session.reset(session.isLocal||session.mode==='grandprix' ? session.mode : 'race');
  menu();
  if (campaign) workshop.open();
}
on($('finish-menu'),'click',returnToPits);
const pauseSettings=new MutationObserver(()=>{
  if($('pause-panel').hidden)return;
  $('pause-view').value=view;
  $('pause-power').value=Math.round(input.power[0]*100);
  $('pause-power-value').textContent=$('pause-power').value+'%';
});
pauseSettings.observe($('pause-panel'),{attributes:true,attributeFilter:['hidden']});
on($('pause-view'),'change',e=>setView(e.target.value,true));
on($('pause-power'),'input',e=>{input.setPower(0,Number(e.target.value)/100);$('pause-power-value').textContent=Math.round(input.power[0]*100)+'%';});
for(const event of ['contextmenu','selectstart'])on($('app'),event,e=>{if(['running','countdown'].includes(session.status))e.preventDefault();});
on($('back-menu'),'click',back);on($('resume'),'click',()=>{session.resume();focus();});on($('pause'),'click',pause);
on($('mode'),'change',()=>{session.mixCourse=null;advance=null;if($('mode').value==='campaign')enterClub();else session.reset($('mode').value);menu();});on($('difficulty'),'change',()=>{session.configure({difficulty:$('difficulty').value});menu();});on($('weather-choice'),'change',()=>{session.weatherChoice=$('weather-choice').value;session.reset();menu();});on($('hazards'),'change',()=>{session.configure({hazards:$('hazards').checked});menu();});on($('assist'),'change',()=>{session.configure({assisted:$('assist').checked});menu();});
on($('garage-open'),'click',()=>{advance=null;input.clear();workshop.open();window.scrollTo(0,0);});
on($('help-open'),'click',()=>{input.clear();session.pause();$('help').showModal();});on($('help-close'),'click',()=>$('help').close());
on($('coach-setting'),'change',()=>{session.guidance=$('coach-setting').value;});
function compactHUD(enabled) {
  $('app').dataset.compact = String(enabled);
  $('compact-hud').setAttribute('aria-pressed',String(enabled));
}
try {compactHUD(local?.getItem('slot08.compact') !== 'false');} catch {compactHUD(true);}
on($('compact-hud'),'click',()=>{
  const enabled=$('app').dataset.compact !== 'true';
  compactHUD(enabled);
  try {local?.setItem('slot08.compact',String(enabled));} catch {}
});
on($('audio-settings'),'click',()=>{input.clear();session.pause();$('audio-mixer').showModal();});on($('audio-close'),'click',()=>$('audio-mixer').close());
const volume=()=>{sound.setVolumes({music:Number($('music-volume').value)/100,effects:Number($('effects-volume').value)/100});$('music-value').textContent=$('music-volume').value+'%';$('effects-value').textContent=$('effects-volume').value+'%';try{local?.setItem('slot08.mix.v1',JSON.stringify({music:sound.musicVolume,effects:sound.effectsVolume}));}catch{}};try{const mix=JSON.parse(local?.getItem('slot08.mix.v1')||'null');if(mix){sound.setVolumes(mix);$('music-volume').value=Math.round(sound.musicVolume*100);$('effects-volume').value=Math.round(sound.effectsVolume*100);}}catch{}volume();on($('music-volume'),'input',volume);on($('effects-volume'),'input',volume);
let audioWanted = true, audioBusy = false;
try { audioWanted = local?.getItem('slot08.audio') !== 'off'; } catch {}
function showAudio() {
  $('sound').innerHTML=icon('audio');$('sound').title=audioWanted?'Audio acceso':'Audio spento';$('sound').setAttribute('aria-label',$('sound').title);
  $('sound').setAttribute('aria-pressed', String(audioWanted));
  $('audio-state').textContent = sound.enabled ? 'Audio attivo · motore, gomme e musica' : audioWanted ? 'Il suono parte con la gara' : 'Audio spento';
}
async function syncAudio() {
  if (audioBusy) return;
  audioBusy = true;
  try {
    while (audioWanted !== sound.enabled) {
      const target = audioWanted;
      await sound.toggle();
      if (sound.enabled !== target) {
        if (target === audioWanted) audioWanted = sound.enabled;
        break;
      }
    }
  } finally { audioBusy = false; showAudio(); }
}
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('button');
  if(!audioWanted||!button||button.disabled||button.id==='sound'||button.closest('.touch-controls'))return;
  await syncAudio();
  if(sound.enabled)sound.chirp(920,460,.055,.038);
});
function startAudio() { if (audioWanted) void syncAudio(); }
showAudio();
on($('sound'),'click',()=>{
  audioWanted = !audioWanted;
  try { local?.setItem('slot08.audio',audioWanted?'on':'off'); } catch {}
  showAudio(); void syncAudio(); focus();
});
loop=new FixedLoop(dt=>{for(const c of session.cars){c.previousDistance=c.distance;c.previousPose=c.pose;c.previousDrift=c.driftAngle;c.previousState=c.state;}session.update(dt,input.readAll());},(alpha,now)=>{loop.setRenderRate(graphics.fps);renderer.render(session,alpha);
const fx=$('weather-fx'),weather=['running','countdown'].includes(session.status)&&!renderer.garage&&!session.track.tunnelAt(session.player.distance)?session.track.weather:'dry';
if(fx.dataset.sky!==weather)fx.dataset.sky=weather;
hud.render(now);updateAdvance(now);graphics.update(now);sound.update(session,session.status==='running');});
enterClub();menu();await renderer.ready;renderer.render(session,1);document.querySelectorAll('[data-boot-disabled]').forEach(el=>el.disabled=false);$('start').disabled=false;$('tutorial-start').disabled=false;$('difficulty').disabled=false;loop.start();$('poster').hidden=true;
const suspend=()=>{input.clear();session.pause();sound.update(session,false);};on(window,'blur',suspend);on(document,'visibilitychange',()=>{if(document.hidden){suspend();loop.stop();}else{loop.resetClock();loop.start();}});on(window,'pagehide',e=>{suspend();loop.stop();if(!e.persisted){workshop.destroy();input.destroy();renderer.destroy();sound.destroy();abort.abort();}});on(window,'pageshow',e=>{if(e.persisted)loop.start();});
window.slot08=Object.freeze({snapshot:()=>({status:session.status,phase:session.phase,mode:session.mode,variant:session.track.variant,lanes:session.track.laneCount,track:session.level,assisted:session.assisted,time:session.elapsed,cars:session.cars.map(c=>({id:c.id,lane:c.lane,queued:c.switchQueued,changing:!!c.change,drift:c.driftAngle,instability:c.instability,state:c.state,speed:c.speed,distance:c.distance,laps:c.laps,crashes:c.crashes})),render:renderer.stats?.()??{type:'2d'}})});
