import { DriverInput, PLAYER_KEYS } from './state.js';
export class InputController {
  constructor({canvas,throttle,lane,toggle,extra=[],onPause,onActivity,onCamera=()=>{},isDriving=()=>true}){
    this.states=Array.from({length:3},()=>new DriverInput());this.playerCount=1;this.toggleMode=false;this.onActivity=onActivity;this.abort=new AbortController();
    const on=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal:this.abort.signal});
    on(window,'keydown',e=>{
      if(document.querySelector('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
      if(['KeyP','Escape'].includes(e.code)&&!e.repeat){e.preventDefault();onPause();return;}
      if(!isDriving())return;
      for(let i=0;i<this.playerCount;i++){
        const map=PLAYER_KEYS[i],state=this.states[i];
        if(e.code===map.gas){e.preventDefault();if(!e.repeat){state.press('keyboard',this.toggleMode);onActivity();}return;}
        if(map.lane.includes(e.code)){e.preventDefault();if(!e.repeat){state.pendingSwitch=true;onActivity();}return;}
      }
      if(e.code==='KeyC'&&!e.repeat){e.preventDefault();onCamera();}
    });
    on(window,'keyup',e=>{PLAYER_KEYS.forEach((map,i)=>{if(map.gas===e.code)this.states[i].held.delete('keyboard');});});
    const attach=(node,i,canvasInput=false)=>{
      on(node,'pointerdown',e=>{if(e.button!==0||!isDriving()||i>=this.playerCount||canvasInput&&this.playerCount>1)return;e.preventDefault();node.setPointerCapture(e.pointerId);this.states[i].press(`pointer-${e.pointerId}`,this.toggleMode);onActivity();});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])on(node,type,e=>this.states[i].held.delete(`pointer-${e.pointerId}`));
      on(node,'contextmenu',e=>e.preventDefault());
    };
    [{throttle,lane},...extra].forEach((buttons,i)=>{
      attach(buttons.throttle,i);
      on(buttons.throttle,'click',e=>{if(e.detail===0&&isDriving()&&i<this.playerCount&&!this.states[i].held.has('keyboard')){this.states[i].latched=!this.states[i].latched;onActivity();}});
      on(buttons.lane,'click',()=>{if(isDriving()&&i<this.playerCount){this.states[i].pendingSwitch=true;onActivity();}});
    });
    attach(canvas,0,true);on(toggle,'change',()=>{this.clear();this.toggleMode=toggle.checked;});on(window,'blur',()=>this.clear());
  }
  configure(count){this.clear();this.playerCount=Math.max(1,Math.min(3,count));}
  get throttle(){return this.states[0].throttle;}
  read(){return this.states[0].read();}
  readAll(){return this.states.slice(0,this.playerCount).map(s=>s.read());}
  clear(index){if(Number.isInteger(index))this.states[index]?.clear();else this.states.forEach(s=>s.clear());}
  destroy(){this.clear();this.abort.abort();}
}
