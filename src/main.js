import { RaceSession } from './game/session.js';
import { Profile } from './game/profile.js';
import { FixedLoop } from './core/loop.js';
import { InputController } from './input/controller.js';
import { SoundEngine } from './audio/sound.js';
import { HUD } from './ui/hud.js';
import { LEVELS, createTrack } from './track/catalog.js';
import { formatTime } from './core/math.js';
const $=id=>document.getElementById(id);let local;try{local=window.localStorage;}catch{}
const profile=new Profile(local),sound=new SoundEngine();let input,loop,renderer,view='drone',resumeDialog=false;
const session=new RaceSession({onEvent:e=>{
  if(e.type==='lap'&&!e.car.ai){const record=profile.record(session.recordKey,e.lap);session.toast(record?'NUOVO RECORD · '+formatTime(e.lap):'GIRO COMPLETATO · '+formatTime(e.lap));sound.beep(record);}
  if(e.type==='derail'&&!e.car.ai)input?.clear();
  if(['pause','reset','finish','tutorial-complete'].includes(e.type))input?.clear();
  if(['beep','switch','tutorial-step'].includes(e.type))sound.beep(e.go);
  if(e.type==='finish'){session.reward=profile.complete(session);finish(false);}
  if(e.type==='tutorial-complete'){profile.data.tutorial=true;profile.save();finish(true);}
}});
session.configure({upgrades:profile.data.upgrades});
const focus=()=>$('game').focus({preventScroll:true});
const pause=()=>{input?.clear();session.status==='paused'?session.resume():session.pause();};
const status=text=>$('scene-status').textContent=text;
let canvas=$('game');
try{if(new URLSearchParams(location.search).get('renderer')==='2d')throw Error('2D requested');const {Scene3D}=await import('./render/scene3d.js');renderer=new Scene3D(canvas,session.track,{onStatus:status,onLost:()=>{session.pause();status('GRAFICA SOSPESA');$('poster').hidden=false;},onRestored:()=>{$('poster').hidden=true;status('3D RIPRISTINATO');}});}
catch(e){console.warn('Canvas fallback',e);const copy=canvas.cloneNode(true);canvas.replaceWith(copy);canvas=copy;const {Canvas2D}=await import('./render/canvas2d.js');renderer=new Canvas2D(canvas,session.track,{onStatus:status});document.querySelectorAll('.camera-bar button').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(b.id==='view-top'));});}
const setView=v=>{view=v;renderer.setView(v);for(const mode of ['drone','rail','iso','top'])$('view-'+mode).setAttribute('aria-pressed',String(v===mode));};
const cycle=()=>{const views=['drone','rail','iso','top'];setView(views[(views.indexOf(view)+1)%4]);};
input=new InputController({canvas,throttle:$('throttle'),lane:$('lane'),toggle:$('toggle-throttle'),onPause:pause,onActivity:()=>{},onCamera:cycle,isDriving:()=>['running','countdown'].includes(session.status)});
const hud=new HUD(session,profile,input),abort=new AbortController(),on=(node,event,fn)=>node.addEventListener(event,fn,{signal:abort.signal});
function trackIcon(index){const t=createTrack(index),b=t.bounds;const points=Array.from({length:110},(_,i)=>{const p=t.sample(i/109*t.length);return`${((p.x-b.minX)/(b.maxX-b.minX)*60).toFixed(1)},${((p.y-b.minY)/(b.maxY-b.minY)*38).toFixed(1)}`;}).join(' ');return`<svg viewBox="0 0 60 38" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${LEVELS[index].color}" stroke-width="3" stroke-linejoin="round"/></svg>`;}
function menu(){const level=LEVELS[session.level];$('track-name').textContent=level.name;$('track-subtitle').textContent=level.subtitle;$('track-length').textContent=Math.round(session.track.length)+' M';$('footer-track').textContent=String(session.level+1).padStart(2,'0')+' — '+level.name.toUpperCase();$('mode').value=session.mode;$('first-run').hidden=profile.data.tutorial;
  $('level-list').innerHTML=LEVELS.map((l,i)=>`<button class="level-card" data-level="${i}" aria-pressed="${i===session.level}" ${i>profile.data.unlocked?'disabled':''}>${trackIcon(i)}<span><small>${l.tag}</small><strong>${l.name}</strong></span><span class="badge">${i>profile.data.unlocked?'⌁':profile.data.medals[i]?'★'.repeat(profile.data.medals[i]):'↗'}</span></button>`).join('');
  for(const b of $('level-list').querySelectorAll('button'))on(b,'click',()=>{const level=Number(b.dataset.level);if(level<=profile.data.unlocked){session.configure({level});menu();}});
}
function begin(){input.clear();session.reset($('mode').value);session.start();setView('drone');focus();window.scrollTo({top:0,behavior:'instant'});}
function back(){input.clear();session.reset($('mode').value);menu();loop?.resetClock();}
function finish(tutorial){const r=session.reward;$('finish-kicker').textContent=tutorial?'SCUOLA GUIDA COMPLETATA':LEVELS[session.level].name.toUpperCase();$('finish-title').textContent=tutorial?'Ora sei al volante.':r.rank===1?'Il podio è tuo.':'Ogni giro conta.';$('finish-stars').textContent=tutorial?'✓':'★'.repeat(r.stars)+'☆'.repeat(3-r.stars);$('finish-summary').textContent=tutorial?'Gas, rilascio, scambio: hai provato tutti i comandi.':`${r.rank}° posto · ${formatTime(session.elapsed)} · ${session.player.crashes} uscite`;$('finish-reward').textContent=tutorial?'La prima gara ti aspetta.':`+${r.credits} CR${r.unlocked?' · NUOVO CIRCUITO SBLOCCATO':''}`;$('next-level').textContent=tutorial?'LA MIA PRIMA GARA →':session.level<2?'PROSSIMO CIRCUITO →':'CORRI ANCORA →';}
function garage(){const labels={motor:['Motore','Più accelerazione e velocità massima'],grip:['Magneti','Più tenuta in curva'],brake:['Freno motore','Rallenta in meno spazio']};$('upgrades').innerHTML=Object.entries(labels).map(([k,[name,desc]])=>{const n=profile.data.upgrades[k],cost=profile.price(k);return`<div class="upgrade"><div><strong>${name} <span>${'▰'.repeat(n)}${'▱'.repeat(3-n)}</span></strong><small>${desc}</small></div><button data-upgrade="${k}" ${cost>profile.data.credits?'disabled':''}>${n===3?'AL MASSIMO':cost+' CR / MIGLIORA'}</button></div>`;}).join('');$('garage-note').textContent=profile.data.credits+' CR disponibili';for(const b of $('upgrades').querySelectorAll('button'))on(b,'click',()=>{if(profile.upgrade(b.dataset.upgrade)){session.configure({upgrades:profile.data.upgrades});garage();menu();}});}
for(const v of ['drone','rail','iso','top'])on($('view-'+v),'click',()=>{setView(v);focus();});
on($('start'),'click',()=>{if(!profile.data.tutorial){session.beginTutorial();setView('drone');focus();window.scrollTo(0,0);}else begin();});
on($('tutorial-start'),'click',()=>{session.beginTutorial();setView('drone');focus();window.scrollTo(0,0);});
on($('tutorial-skip'),'click',()=>{profile.data.tutorial=true;profile.save();session.reset('race');$('mode').value='race';begin();});
on($('next-level'),'click',()=>{const tutorial=session.status==='tutorial-complete';session.level=tutorial?0:Math.min(2,session.level+1);$('mode').value='race';begin();});
on($('finish-menu'),'click',()=>{session.reset('race');menu();});on($('back-menu'),'click',back);on($('resume'),'click',()=>{session.resume();focus();});on($('pause'),'click',pause);
on($('mode'),'change',()=>{session.reset($('mode').value);menu();});on($('difficulty'),'change',()=>{session.configure({difficulty:$('difficulty').value});menu();});on($('assist'),'change',()=>{session.configure({assisted:$('assist').checked});menu();});
on($('garage-open'),'click',()=>{input.clear();if(session.status!=='ready'){session.pause();resumeDialog=true;}garage();$('garage').showModal();});on($('garage-close'),'click',()=>$('garage').close());
on($('help-open'),'click',()=>{input.clear();session.pause();$('help').showModal();});on($('help-close'),'click',()=>$('help').close());
on($('sound'),'click',async()=>{const enabled=await sound.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('sound').textContent='♪ Audio '+(enabled?'on':'off');focus();});
loop=new FixedLoop(dt=>{for(const c of session.cars)c.previousPose=c.pose;session.update(dt,input.read());},(alpha,now)=>{renderer.render(session,alpha);hud.render(now);if(renderer.stats){const stats=renderer.stats();$('scene-status').dataset.drawCalls=stats.calls;$('scene-status').dataset.triangles=stats.triangles;$('scene-status').dataset.geometries=stats.geometries;$('scene-status').dataset.fps=stats.fps?.toFixed(1);}sound.update(session.player,session.status==='running');});
menu();$('start').disabled=false;$('tutorial-start').disabled=false;loop.start();$('poster').hidden=true;
const suspend=()=>{input.clear();session.pause();sound.update(session.player,false);};on(window,'blur',suspend);on(document,'visibilitychange',()=>{if(document.hidden){suspend();loop.stop();}else{loop.resetClock();loop.start();}});on(window,'pagehide',e=>{suspend();loop.stop();if(!e.persisted){input.destroy();renderer.destroy();sound.destroy();abort.abort();}});on(window,'pageshow',e=>{if(e.persisted)loop.start();});
window.slot08=Object.freeze({snapshot:()=>({status:session.status,track:session.level,assisted:session.assisted,time:session.elapsed,cars:session.cars.map(c=>({id:c.id,lane:c.lane,queued:c.switchQueued,changing:!!c.change,state:c.state,speed:c.speed,distance:c.distance,laps:c.laps,crashes:c.crashes})),render:renderer.stats?.()??{type:'2d'}})});
