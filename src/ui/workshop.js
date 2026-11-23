import { icon } from './icons.js';
import { PARTS, TRIM, PAINTS, DECALS, UPGRADE_LIMIT, PART_DETAILS, partPrice } from '../game/workshop.js';
import { FLEET,openWorld } from '../game/tour.js';
const DEPTS={fleet:'Scuderia',paint:'Colore',mechanics:'Meccanica',wheels:'Cerchi',wing:'Alettoni',hood:'Cofano',aero:'Aerodinamica',lights:'Luci',exhaust:'Scarichi',glass:'Abitacolo'};
const ROWS={wing:0,wheels:1,hood:2,aero:3,lights:4,exhaust:5};
const thumb=(row,col=0)=>`<span class="part-thumb" aria-hidden="true" style="background-position:${col*10}% ${row*100/6}%"></span>`;
const $=id=>document.getElementById(id);
export class Workshop {
 constructor(profile,session,renderer,onChange){this.profile=profile;this.session=session;this.renderer=renderer;this.onChange=onChange;this.department='fleet';this.category='wing';this.focus='fleet';this.choice=0;this.abort=new AbortController();
  const on=(id,type,fn)=>$(id).addEventListener(type,fn,{signal:this.abort.signal});
  on('garage-close','click',()=>this.close());on('garage','cancel',()=>this.exit());
  const keys=Object.keys(DEPTS);
  const move=step=>this.select(keys[(keys.indexOf(this.department)+step+keys.length)%keys.length],step);
  on('garage-categories','keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   if(event.key==='Home'||event.key==='End')this.select(keys[event.key==='Home'?0:keys.length-1]);
   else move(event.key==='ArrowRight'?1:-1);
   $('garage-categories').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
  });
  on('tab-prev','click',()=>move(-1));on('tab-next','click',()=>move(1));
  on('garage-categories','click',e=>{const b=e.target.closest('[data-category]');if(b)this.select(b.dataset.category);});
  on('fleet-list','click',e=>{const b=e.target.closest('[data-car]');if(!b)return;const n=Number(b.dataset.car);this.previewCar=n;
    if(this.profile.canDrive(n)){this.profile.selectCar(n);this.session.carIndex=n;this.commit();}this.render();$('fleet-list').querySelector('[data-car="'+n+'"]')?.focus({preventScroll:true});});
  let drag=null;on('orbit-pad','pointerdown',e=>{$('orbit-pad').setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY];});
  on('orbit-pad','pointermove',e=>{if(drag){this.renderer.orbit?.((drag[0]-e.clientX)*.014,(e.clientY-drag[1])*.012);drag=[e.clientX,e.clientY];}});
  on('orbit-pad','lostpointercapture',()=>drag=null);
  on('garage-center','click',()=>{this.renderer.centerGarage?.();for(const b of $('garage-views').querySelectorAll('[data-angle]'))b.setAttribute('aria-pressed',String(b.dataset.angle==='0.65'));});
  on('under-view','click',()=>this.renderer.inspect?.('under'));
  on('zoom-in','click',()=>this.renderer.magnify?.(1.2));on('zoom-out','click',()=>this.renderer.magnify?.(1/1.2));
  let start=null;const panel=document.querySelector('.garage-panel');
  const touchOptions={passive:true,signal:this.abort.signal};
  panel.addEventListener('touchcancel',()=>{start=null;},touchOptions);
  panel.addEventListener('touchstart',e=>{start=null;if(e.touches.length===1&&!e.target.closest('#part-options,select,input'))start=[e.touches[0].clientX,e.touches[0].clientY];},touchOptions);
  panel.addEventListener('touchend',e=>{if(start){const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)move(dx<0?1:-1);}start=null;},touchOptions);
  on('part-options','click',e=>{const button=e.target.closest('[data-choice]');if(button){this.choice=Number(button.dataset.choice);this.focus=this.category;this.render();this.renderer.inspect?.(this.focus);}});
  on('part-buy','click',()=>{if(this.profile.equip(this.category,this.choice)){this.commit();this.render();}});
  on('paint-options','click',e=>{const button=e.target.closest('[data-paint]');if(button&&this.profile.equip('paint',button.dataset.paint)){this.commit();this.render();}});
  on('decal-options','change',()=>{this.profile.equip('decal',Number($('decal-options').value));this.commit();this.render();});
  on('trim-options','click',e=>{const b=e.target.closest('[data-trim]');if(!b)return;
   if(this.profile.equip(b.dataset.trim,b.value)){this.commit();this.render();this.renderer.inspect?.(b.dataset.trim==='glass'?'glazing':'glass');$('trim-options').querySelector('[value="'+b.value+'"]')?.focus({preventScroll:true});}});
  on('upgrades','click',e=>{
    const preview=e.target.closest('[data-preview-upgrade]'),buy=e.target.closest('[data-upgrade]');
    if(preview){this.focus=preview.dataset.previewUpgrade;this.mechanicalPreview=this.focus;this.render();this.renderer.inspect?.(this.focus);}
    if(buy){this.focus=buy.dataset.upgrade;if(this.profile.upgrade(this.focus))this.commit();this.mechanicalPreview=null;this.render();this.renderer.inspect?.(this.focus);}
    const tune=e.target.closest('[data-tuning]');if(tune&&this.profile.setTuning(tune.dataset.tuning)){this.commit();this.render();}
    if(e.target.closest('[data-reset-preview]')){this.mechanicalPreview=null;this.render();}
  });
  on('garage-views','click',e=>{const button=e.target.closest('[data-angle]');if(button){this.renderer.setGarageView?.(Number(button.dataset.angle));for(const b of $('garage-views').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));}});
 }
 select(key,direction){
  const previous=this.department,keys=Object.keys(DEPTS),panel=document.querySelector('.garage-panel');
  const rail=$('garage-categories'),sheet=panel.querySelector('.garage-sheet');
  const changed=key!==previous,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusInPage=sheet.contains(document.activeElement);
  if(changed){
   this.positions??=new Map();this.positions.set(previous,panel.scrollTop);
   this.transition?.cancel();
  }
  this.mechanicalPreview=null;this.department=key;this.focus=key==='mechanics'?'motor':key;
  if(PARTS[key]){this.category=key;this.choice=this.profile.data.appearance[key];}
  this.render();this.renderer.inspect?.(this.focus);
  const button=rail.querySelector('[aria-pressed=true]');
  if(changed){
   panel.scrollTop=this.positions.get(key)??0;
   if(focusInPage)button.focus({preventScroll:true});
   if(!reduce&&sheet.animate){
    const side=direction??Math.sign(keys.indexOf(key)-keys.indexOf(previous));
    this.transition=sheet.animate([{opacity:.34,transform:'translateX('+side*48+'px)'},{opacity:1,transform:'translateX(0)'}],
      {duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
   }
  }
  const visible=rail.getBoundingClientRect(),target=button.getBoundingClientRect();
  const delta=target.left<visible.left?target.left-visible.left:Math.max(0,target.right-visible.right);
  if(delta)rail.scrollBy({left:delta,behavior:reduce?'instant':'smooth'});
 }
 commit(){this.session.tuning=this.profile.vehicle.tuning;this.session.configure({upgrades:this.profile.data.upgrades,appearance:this.profile.data.appearance});this.onChange();}
 open(){this.previewCar=this.profile.data.car;this.session.pause();this.choice=this.profile.data.appearance[this.category];$('app').dataset.garage='true';document.body.classList.add('garage-open');$('garage').showModal();this.select(this.department);}
 exit(){this.transition?.cancel();document.body.classList.remove('garage-open');delete $('app').dataset.garage;this.renderer.setGarage?.(false);}
 close(){this.exit();$('garage').close();}
 render(){const p=this.profile,d=p.data,catalog=PARTS[this.category];
  const active=document.activeElement;
  const focusAttr=['data-car','data-choice','data-paint','data-upgrade','data-preview-upgrade','data-reset-preview','data-trim','aria-label'].find(attr=>active?.hasAttribute(attr));
  const focusValue=focusAttr&&active.getAttribute(focusAttr);
  const dep=this.department;
  const shown=dep==='fleet'?(this.previewCar??d.car):d.car;
  $('atelier-model').textContent=FLEET[shown].name+' / ATELIER';
  $('department').textContent=DEPTS[dep];
  $('fleet-list').hidden=dep!=='fleet';$('pieces').hidden=!PARTS[dep];
  document.querySelector('.garage-performance').hidden=dep!=='mechanics';document.querySelector('.garage-finish').hidden=dep!=='paint';
  $('fleet-list').innerHTML=FLEET.map((c,i)=>({c,i})).sort((a,b)=>a.c.world-b.c.world).map(({c,i})=>`<button data-car="${i}" data-locked="${!p.canDrive(i)}" aria-pressed="${shown===i}"><span aria-hidden="true" class="fleet-thumb" style="background-position:${(i%3)*50}% ${Math.floor(i/3)*50}%"></span><strong>${c.name}</strong><small>${c.type} · ${d.car===i?'IN PISTA · motore Lv.'+d.upgrades.motor:!p.canDrive(i)?'BLOCCATA · raggiungi il mondo '+(c.world+1):'DISPONIBILE · motore Lv.'+(d.vehicles[i]?.upgrades.motor??Math.min(30,1+Math.max(c.world,d.upgrades.motor)))} · motore ${Math.round(c.drive*100)}% · tenuta ${Math.round(c.grip*100)}%</small></button>`).join('');
  $('trim-options').hidden=dep!=='glass';
  if(dep==='glass')$('trim-options').innerHTML=Object.entries(TRIM).map(([key,options])=>'<h3>'+(key==='glass'?'Vetri':'Sedili')+'</h3>'+options.map(([color,name])=>`<button data-trim="${key}" value="${color}" aria-pressed="${color===d.appearance[key]}">${name}</button>`).join('')).join('');
  $('garage-wallet').textContent=d.credits+' CR';
  if(!$('garage-categories').childElementCount)$('garage-categories').innerHTML=Object.entries(DEPTS).map(([key,label])=>`<button data-category="${key}">${icon({fleet:'garage',paint:'paint',mechanics:'motor',wheels:'wheel',wing:'spark',hood:'motor',aero:'spark',lights:'spark',exhaust:'motor',glass:'garage'}[key])}<span>${label}</span></button>`).join('');
  for(const b of $('garage-categories').children)b.setAttribute('aria-pressed',String(b.dataset.category===dep));
  $('part-options').innerHTML=catalog.names.map((name,i)=>`<button data-choice="${i}" aria-pressed="${i===this.choice}">${thumb(ROWS[this.category],i)}<strong>${name}</strong><small>${p.owns(this.category,i)?d.appearance[this.category]===i?'MONTATO':'DISPONIBILE':partPrice(i)+' CR'}</small></button>`).join('');
  $('garage-views').hidden=false;$('part-name').textContent=catalog.label+' / '+catalog.names[this.choice];$('part-buy').textContent=p.owns(this.category,this.choice)?'MONTA SULLA GT':'ACQUISTA E MONTA · '+partPrice(this.choice)+' CR';$('part-buy').disabled=!p.owns(this.category,this.choice)&&partPrice(this.choice)>d.credits;
  $('paint-options').innerHTML=PAINTS.map((color,i)=>`<button data-paint="${color}" aria-label="Vernice ${i+1}" aria-pressed="${d.appearance.paint===color}" style="--paint:${color}"></button>`).join('');
  $('decal-options').innerHTML=DECALS.map((v,i)=>`<option value="${i}" ${i===d.appearance.decal?'selected':''}>${v}</option>`).join('');
  const labels={motor:['Motore','Spinta +6% e regime massimo +3,4% per livello'],grip:['Pneumatici e magneti','Tenuta +2,7% per livello · magnete sotto il telaio'],brake:['Freno motore','Freno motore +8% per livello · scheda sul telaio']};
  $('upgrades').innerHTML=Object.entries(labels).map(([key,[name,desc]],i)=>{
    const level=d.upgrades[key],next=Math.min(UPGRADE_LIMIT,level+1),selected=this.mechanicalPreview===key;
    return `<article class="hardware-card"><button data-preview-upgrade="${key}" aria-pressed="${selected}">${thumb(6,i)}<span><strong>${name}</strong><small>LIVELLO ${level} → ${next}</small><em>${desc}</em><b>${selected?'ANTEPRIMA ATTIVA':'VEDI IL POTENZIAMENTO'}</b></span></button><div><progress max="${UPGRADE_LIMIT}" value="${level}"></progress><button data-upgrade="${key}" ${p.price(key)>d.credits?'disabled':''}>${level===UPGRADE_LIMIT?'COMPLETO':'MONTA · '+p.price(key)+' CR'}</button></div></article>`;
  }).join('')+(d.upgrades.motor>=20?`<div class="mastery-tuning"><h3>Livello 20 · assetti speciali</h3><p>La potenza ha un limite. Scegli il compromesso, prepara le altre auto e colleziona vittorie: ${p.vehicle.wins} su questa macchina.</p>${[['balanced','Bilanciato'],['sprint','Sprint · +4,5% spinta / −1,5% tenuta'],['endurance','Endurance · +6% freno / −2% velocità']].map(([id,label])=>`<button data-tuning="${id}" aria-pressed="${p.vehicle.tuning===id}">${label}</button>`).join('')}</div>`:'')+(this.mechanicalPreview?'<button data-reset-preview>TORNA ALL’ASSETTO MONTATO</button>':'');
  $('part-detail').textContent=PART_DETAILS[this.category][this.choice]+(dep==='wheels'?' Tenuta +'+(this.choice*.3).toFixed(1)+'%.':dep==='wing'?' Stabilità +'+(this.choice*.2).toFixed(1)+'%.':'');
  $('garage-note').textContent=dep==='glass'?'Vista aperta di sedili, cinture e vetratura.':dep==='mechanics'?(this.mechanicalPreview?'ANTEPRIMA · nessun credito speso. Monta per acquistare.':'Scegli un sistema per vedere il livello successivo prima dell’acquisto.'):'';
  $('garage-preview-caption').textContent='ISPEZIONE 3D';
  if(!PARTS[dep])$('part-name').textContent=FLEET[shown].name+' / '+DEPTS[dep];
  if(focusAttr&&!active.isConnected){
   const section=document.querySelector('.garage-sheet');
   const replacement=[...section.querySelectorAll('button['+focusAttr+']')].find(node=>
      node.getAttribute(focusAttr)===focusValue&&node.value===active.value&&!node.closest('[hidden]'));
   if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});
   else if(replacement?.disabled)replacement.parentElement.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  const previewUpgrades=shown!==d.car?(d.vehicles[shown]?.upgrades||{motor:0,grip:0,brake:0}):this.mechanicalPreview?{...d.upgrades,[this.mechanicalPreview]:Math.min(UPGRADE_LIMIT,d.upgrades[this.mechanicalPreview]+1)}:d.upgrades;
  this.renderer.setGarage?.(true,PARTS[dep]?{...d.appearance,[dep]:this.choice}:d.appearance,previewUpgrades,shown);
 }
 destroy(){this.abort.abort();}
}
