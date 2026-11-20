import test from 'node:test';
import assert from 'node:assert/strict';
import {InputController} from '../src/input/controller.js';
class Control extends EventTarget {
 constructor(dataset={}){super();this.dataset=dataset;this.value='65';this.tagName='BUTTON';}
 setPointerCapture(){}
}
function emit(node,type,props={}){const event=new Event(type,{cancelable:true});for(const [k,v]of Object.entries(props))Object.defineProperty(event,k,{value:v});node.dispatchEvent(event);return event;}
test('slider, large steps, presets and keyboard independently dose three pilots and blur releases gas',()=>{
 const win=new EventTarget(),slider=new Control({gasSlider:'1'}),plus=new Control({gasStep:'.05',pilot:'0'}),preset=new Control({power:'.85',pilot:'2'}),toggle=new Control();
 globalThis.window=win;globalThis.document={querySelector:()=>null,querySelectorAll:selector=>selector==='[data-power]'?[preset]:selector==='[data-gas-slider]'?[slider]:selector==='[data-gas-step]'?[plus]:[]};
 const buttons=()=>({throttle:new Control(),lane:new Control()});const first=buttons(),p2=buttons(),p3=buttons();
 const input=new InputController({canvas:new Control(),...first,toggle,extra:[p2,p3],onPause(){},onActivity(){}});input.configure(3);
 assert.deepEqual(input.power,[.65,.65,.65]);emit(plus,'click');slider.value='45';emit(slider,'input');emit(preset,'click');assert.deepEqual(input.power,[.7,.45,.85]);
 emit(win,'keydown',{code:'Space',repeat:false});emit(win,'keydown',{code:'KeyW',repeat:false});emit(win,'keydown',{code:'KeyI',repeat:false});assert.deepEqual(input.readAll().map(i=>i.throttle),[.7,.45,.85]);
 emit(win,'keydown',{code:'ArrowUp',repeat:false});assert.equal(input.readAll()[0].throttle,.75);
 emit(win,'blur');assert.deepEqual(input.readAll().map(i=>i.throttle),[0,0,0]);
 toggle.checked=true;emit(toggle,'change');emit(first.throttle,'click',{detail:0});assert.equal(input.readAll()[0].throttle,.75);input.clear(0);assert.equal(input.throttle,0);
 input.destroy();delete globalThis.window;delete globalThis.document;
});
