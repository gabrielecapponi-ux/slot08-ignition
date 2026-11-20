import { PARTS, PAINTS, DECALS, UPGRADE_LIMIT, PART_DETAILS, partPrice } from '../game/workshop.js';
const $=id=>document.getElementById(id);
export class Workshop {
 constructor(profile,session,renderer,onChange){this.profile=profile;this.session=session;this.renderer=renderer;this.onChange=onChange;this.category='wing';this.choice=0;this.abort=new AbortController();
  const on=(id,type,fn)=>$(id).addEventListener(type,fn,{signal:this.abort.signal});
  on('garage-close','click',()=>this.close());on('garage','cancel',()=>this.exit());
  on('garage-categories','click',e=>{const button=e.target.closest('[data-category]');if(button){this.category=button.dataset.category;this.choice=this.profile.data.appearance[this.category];this.render();}});
  on('part-options','click',e=>{const button=e.target.closest('[data-choice]');if(button){this.choice=Number(button.dataset.choice);this.render();}});
  on('part-buy','click',()=>{if(this.profile.equip(this.category,this.choice)){this.commit();this.render();}});
  on('paint-options','click',e=>{const button=e.target.closest('[data-paint]');if(button&&this.profile.equip('paint',button.dataset.paint)){this.commit();this.render();}});
  on('decal-options','change',()=>{this.profile.equip('decal',Number($('decal-options').value));this.commit();this.render();});
  on('upgrades','click',e=>{const button=e.target.closest('[data-upgrade]');if(button&&this.profile.upgrade(button.dataset.upgrade)){this.commit();this.render();}});
  on('garage-views','click',e=>{const button=e.target.closest('[data-angle]');if(button){this.renderer.setGarageView?.(Number(button.dataset.angle));for(const b of $('garage-views').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));}});
 }
 commit(){this.session.configure({upgrades:this.profile.data.upgrades,appearance:this.profile.data.appearance});this.onChange();}
 open(){this.session.pause();this.choice=this.profile.data.appearance[this.category];$('app').dataset.garage='true';document.body.classList.add('garage-open');$('garage').showModal();this.render();}
 exit(){document.body.classList.remove('garage-open');delete $('app').dataset.garage;this.renderer.setGarage?.(false);}
 close(){this.exit();$('garage').close();}
 render(){const p=this.profile,d=p.data,catalog=PARTS[this.category];
  $('garage-wallet').textContent=d.credits+' CR';$('garage-categories').innerHTML=Object.entries(PARTS).map(([key,value])=>`<button data-category="${key}" aria-pressed="${key===this.category}">${value.label}</button>`).join('');
  $('part-options').innerHTML=catalog.names.map((name,i)=>`<button data-choice="${i}" aria-pressed="${i===this.choice}"><strong>${name}</strong><small>${p.owns(this.category,i)?d.appearance[this.category]===i?'MONTATO':'DISPONIBILE':partPrice(i)+' CR'}</small></button>`).join('');
  $('garage-views').hidden=this.renderer.kind==='2d';$('part-name').textContent=(this.renderer.kind==='2d'?'VISTA 2D · ':'')+catalog.label+' / '+catalog.names[this.choice];$('part-buy').textContent=p.owns(this.category,this.choice)?'MONTA SULLA GT':'ACQUISTA E MONTA · '+partPrice(this.choice)+' CR';$('part-buy').disabled=!p.owns(this.category,this.choice)&&partPrice(this.choice)>d.credits;
  $('paint-options').innerHTML=PAINTS.map((color,i)=>`<button data-paint="${color}" aria-label="Vernice ${i+1}" aria-pressed="${d.appearance.paint===color}" style="--paint:${color}"></button>`).join('');
  $('decal-options').innerHTML=DECALS.map((v,i)=>`<option value="${i}" ${i===d.appearance.decal?'selected':''}>${v}</option>`).join('');
  const labels={motor:['Motore','Cofano e scarichi evolvono con il livello'],grip:['Pneumatici e magneti','Cerchi diversi con i nuovi gruppi di livelli'],brake:['Freno motore','Kit aerodinamico e diffusore visibili']};
  $('upgrades').innerHTML=Object.entries(labels).map(([key,[name,desc]])=>`<div class="upgrade"><div><strong>${name} <span>${d.upgrades[key]} / ${UPGRADE_LIMIT}</span></strong><small>${desc}</small><progress max="${UPGRADE_LIMIT}" value="${d.upgrades[key]}"></progress></div><button data-upgrade="${key}" ${p.price(key)>d.credits?'disabled':''}>${d.upgrades[key]===UPGRADE_LIMIT?'MAX':p.price(key)+' CR'}</button></div>`).join('');
  $('part-detail').textContent=PART_DETAILS[this.category][this.choice]+' Solo aspetto: nessun bonus nascosto.';
  $('garage-note').textContent='Anteprima prima dell’acquisto. Vernici e livree gratuite. I potenziamenti valgono per tutta la griglia.';
  $('garage-preview-caption').textContent=this.renderer.kind==='2d'?'VISTA 2D · COMPONENTI 3D NON VISIBILI':'ANTEPRIMA LIVE';
  this.renderer.setGarage?.(true,{...d.appearance,[this.category]:this.choice},d.upgrades);
 }
 destroy(){this.abort.abort();}
}
