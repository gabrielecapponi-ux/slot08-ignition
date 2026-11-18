import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundEngine} from '../src/audio/sound.js';
import {RacingScore} from '../src/audio/score.js';
// Verify graph control and scheduling without requiring a physical sound device.
class Param {constructor(v=0){this.value=v;} setTargetAtTime(v){assert.ok(Number.isFinite(v));this.value=v;} setValueAtTime(v){this.setTargetAtTime(v);} exponentialRampToValueAtTime(v){assert.ok(v>0);this.setTargetAtTime(v);} }
class Node {constructor(){for(const k of ['gain','frequency','Q','pan','threshold','knee','ratio','attack','release'])this[k]=new Param();}connect(node){return node;}disconnect(){}start(){}stop(){this.stopped=true;} }
class Audio {constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=new Node();this.state='suspended';this.nodes=[];} node(){const n=new Node();this.nodes.push(n);return n;}createGain(){return this.node();}createOscillator(){return this.node();}createBiquadFilter(){return this.node();}createDynamicsCompressor(){return this.node();}createStereoPanner(){return this.node();}createBufferSource(){return this.node();}createBuffer(channels,n){const data=new Float32Array(n);return{getChannelData:()=>data};}async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}}
function car(id='player'){return{id,ai:false,speed:2,throttle:1,skid:0,state:'slotted',finishedAt:null};}
test('audio is opt-in; engine, braking and skid layers follow actual state and silence on pause',async()=>{
 globalThis.window={AudioContext:Audio};const sound=new SoundEngine(),c=car(),session={player:c,cars:[c],guidanceEnabled:false};assert.equal(sound.context,null);assert.equal(await sound.toggle(),true);sound.update(session,true);const voice=sound.voices.get('player'),pitch=voice.engine.o.frequency.value;assert.ok(voice.engine.g.gain.value>0);assert.equal(voice.coast.g.gain.value,0);
 c.speed=3;c.throttle=0;c.skid=.8;sound.context.currentTime+=.2;sound.update(session,true);assert.ok(voice.engine.o.frequency.value>pitch);assert.ok(voice.coast.g.gain.value>0);assert.ok(voice.tyre.g.gain.value>0);assert.ok(voice.rubber.g.gain.value>0);
 sound.update(session,false);for(const key of ['engine','sub','tyre','rubber','coast'])assert.equal(voice[key].g.gain.value,0);assert.equal(sound.music.gain.value,0);assert.equal(sound.score.running,false);
 sound.setVolumes({music:0,effects:.8});sound.update(session,true);assert.equal(sound.music.gain.value,0);assert.equal(sound.effects.gain.value,.8);assert.equal(await sound.toggle(),false);assert.equal(sound.context.state,'suspended');sound.destroy();assert.equal(sound.voices.size,0);delete globalThis.window;
});
test('removed rivals are silenced, sound volumes clamp and repeated score scheduling stays bounded',async()=>{
 globalThis.window={AudioContext:Audio};const sound=new SoundEngine();await sound.toggle();const c=car(),other=car('p2');sound.update({player:c,cars:[c,other]},true);sound.update({player:c,cars:[c]},true);assert.equal(sound.voices.get('p2').engine.g.gain.value,0);sound.setVolumes({music:8,effects:-4});assert.equal(sound.musicVolume,1);assert.equal(sound.effectsVolume,0);
 const ctx=new Audio(),score=new RacingScore(ctx,new Node(),ctx.createBuffer(1,8000));score.update(true,.8);const count=ctx.nodes.length;for(let i=0;i<500;i++)score.update(true,.8);assert.equal(ctx.nodes.length,count,'same audio time cannot schedule repeated beats');ctx.currentTime=200;score.update(true,.8);assert.ok(ctx.nodes.length-count<30,'missed frames must not create a burst');score.update(false);assert.equal(score.running,false);sound.destroy();delete globalThis.window;
});
