import test from 'node:test';
import assert from 'node:assert/strict';
import {installScreenControls} from '../src/ui/screen.js';

function setup(t, {native=false, standalone=false, denied=false}={}) {
  const saved = ['document','window','navigator'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]);
  t.after(()=>saved.forEach(([key,descriptor])=>descriptor ? Object.defineProperty(globalThis,key,descriptor) : delete globalThis[key]));
  const document = new EventTarget(), media = new EventTarget();
  media.matches=standalone;
  let requests=0, pauses=0;
  document.documentElement={};document.fullscreenEnabled=native;
  if(native)document.documentElement.requestFullscreen=async()=>{
    requests++;
    if(denied)throw new Error('Browser denied fullscreen');
    document.fullscreenElement=document.documentElement;
  };
  for(const [key,value] of Object.entries({document,window:{matchMedia:()=>media},navigator:{standalone}}))
    Object.defineProperty(globalThis,key,{value,configurable:true});
  const button=new EventTarget();button.attributes={};button.setAttribute=(key,value)=>button.attributes[key]=value;
  const help={open:false,showModal(){this.open=true},close(){this.open=false}};
  const controls=installScreenControls({button,help,close:new EventTarget(),onPause:()=>pauses++,signal:new AbortController().signal});
  return {controls,button,help,requests:()=>requests,pauses:()=>pauses};
}

test('native fullscreen retains application controls and reports its active state',async t=>{
  const s=setup(t,{native:true});await s.controls.enter();
  assert.equal(s.requests(),1);assert.equal(s.button.attributes['aria-pressed'],'true');
  assert.equal(s.pauses(),0);assert.equal(s.help.open,false);
});
test('unsupported fullscreen does not interrupt race start; explicit request explains Home Screen mode',async t=>{
  const s=setup(t);await s.controls.enter(false);
  assert.equal(s.help.open,false);assert.equal(s.pauses(),0);
  await s.controls.enter();assert.equal(s.help.open,true);assert.equal(s.pauses(),1);
});
test('a browser denial gives usable guidance instead of an unhandled rejection',async t=>{
  const s=setup(t,{native:true,denied:true});await s.controls.enter();
  assert.equal(s.help.open,true);assert.equal(s.button.attributes['aria-pressed'],'false');
});
test('an installed app does not prompt again or request redundant fullscreen',async t=>{
  const s=setup(t,{standalone:true});await s.controls.enter();
  assert.equal(s.button.hidden,true);assert.equal(s.help.open,false);assert.equal(s.pauses(),0);
});
