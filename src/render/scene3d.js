import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildModularTrack } from './modular-track.js';
import { MiniatureWorld, THEMES, skyTexture } from './world.js';
import { AssetKit } from './asset-kit.js';
import { addCarStyle, hiddenStockPart } from './car-style.js';
import { effectiveParts } from '../game/workshop.js';
import { CameraRig } from '../camera/rig.js';
import { bodyPose } from '../physics/grip.js';
import { SkidEffects } from './skid-effects.js';

export class Scene3D {
 constructor(canvas,track,{onStatus,onLost,onRestored}={}){
  this.kind='3d';this.canvas=canvas;this.track=track;this.onStatus=onStatus;this.cars=new Map();this.frameSamples=[];this.disposed=false;this.lastTime=performance.now();this.garage=false;this.garageBackground=new THREE.Color('#111d29');
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(48,1,.02,500);this.rig=new CameraRig(this.camera,track);
  this.hemi=new THREE.HemisphereLight(0xe8f3ec,0x647461,1.7);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight(0xffedd2,2.4);this.sun.position.set(-5,14,6);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1536,1536);this.sun.shadow.bias=-.00013;this.sun.shadow.normalBias=.006;this.scene.add(this.sun);this.scene.add(this.sun.target);
  const fill=new THREE.DirectionalLight(0xaccbff,.8);fill.position.set(5,4,-6);this.scene.add(fill);
  this.ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#8b795f',roughness:.9}));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-.45;this.ground.receiveShadow=true;this.scene.add(this.ground);
  this.prototype=this.fallbackCar();this.setTrack(track);
  this.marker=new THREE.Mesh(new THREE.RingGeometry(.19,.21,32),new THREE.MeshBasicMaterial({color:0xc6f568,transparent:true,opacity:.7,depthWrite:false}));this.marker.rotation.x=-Math.PI/2;this.scene.add(this.marker);
  this.switchGlow=new THREE.Mesh(new THREE.RingGeometry(.4,.46,40),new THREE.MeshBasicMaterial({color:0x78f6da,transparent:true,opacity:.75,depthWrite:false}));this.switchGlow.rotation.x=-Math.PI/2;this.scene.add(this.switchGlow);
  this.skidEffects=new SkidEffects(this.scene);
  this.brakeMarks=new THREE.InstancedMesh(new THREE.PlaneGeometry(.075,.63),new THREE.MeshBasicMaterial({color:0xffa34d,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}),5);this.brakeTransform=new THREE.Object3D();this.scene.add(this.brakeMarks);
  this.stage=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,.035,64),new THREE.MeshStandardMaterial({color:'#50616d',metalness:.5,roughness:.25}));this.stage.position.y=-.018;this.stage.receiveShadow=true;this.stage.visible=false;this.scene.add(this.stage);
  this.garageLight=new THREE.PointLight(0xc4ecff,0,3);this.garageLight.position.set(.3,.65,.3);this.scene.add(this.garageLight);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  this.lost=e=>{e.preventDefault();onLost?.();};this.restored=()=>{this.resize();onRestored?.();};canvas.addEventListener('webglcontextlost',this.lost);canvas.addEventListener('webglcontextrestored',this.restored);this.ready=this.loadAssets();
 }
 batch(root,filter=()=>true){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||!filter(o))return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld),key=o.material.uuid+Object.keys(g.attributes).join(',');if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(g);});const group=new THREE.Group();for(const {material,geometries}of buckets.values()){const geo=mergeGeometries(geometries);if(geo){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;m.userData.ownGeometry=true;group.add(m);}geometries.forEach(g=>g.dispose());}return group;}
 async loadAssets(){
  const result=await Promise.allSettled([new GLTFLoader().loadAsync(new URL('../../assets/slot08.glb',import.meta.url).href),new AssetKit().load()]);
  if(this.disposed){if(result[0].status==='fulfilled')this.disposeRoot(result[0].value.scene);if(result[1].status==='fulfilled')result[1].value.destroy();return;}
  if(result[0].status==='fulfilled'){this.assetSource=result[0].value.scene;this.sourceCar=this.assetSource.getObjectByName('CAR_GT');if(this.sourceCar){this.sourceCar.removeFromParent();this.sourceCar.position.set(0,0,0);this.sourceCar.rotation.set(0,0,0);}}
  if(result[1].status==='fulfilled')this.kit=result[1].value;
  this.clearCars();this.setTrack(this.track);this.rig.age=0;this.rig.initial=true;this.onStatus?.(this.kit&&this.sourceCar?'WORLDS 6.0 · BLENDER / 89 MODELLI':'3D ESSENZIALE · ASSET NON DISPONIBILI');
  for(const r of result)if(r.status==='rejected')console.warn('Asset fallback',r.reason);
 }
 fallbackCar(){const root=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.065,.15),new THREE.MeshStandardMaterial({name:'MAT_lime_enamel',color:0xc6f568,roughness:.25}));b.position.y=.06;root.add(b);const r=new THREE.Mesh(new THREE.BoxGeometry(.13,.045,.10),new THREE.MeshStandardMaterial({color:0x152b38}));r.position.y=.11;root.add(r);return root;}
 setTrack(track){this.track=track;if(this.staticRoot){this.scene.remove(this.staticRoot);this.disposeRoot(this.staticRoot);}this.staticRoot=buildModularTrack(track);this.world=new MiniatureWorld(track,this.kit);this.staticRoot.add(this.world.root);this.scene.add(this.staticRoot);
  const theme=THEMES[track.theme]??THEMES.forest;this.sky?.dispose();this.sky=skyTexture(track.theme,track.index);this.scene.background=this.sky;this.scene.fog=new THREE.Fog(theme.sky,35,160);this.ground.material.color.set(theme.floor);this.sun.intensity=track.theme==='night'?1.35:2.4;this.sun.color.set(track.theme==='night'?'#bed9ff':'#ffecd3');
  const span=Math.max(track.bounds.maxX-track.bounds.minX,track.bounds.maxY-track.bounds.minY);Object.assign(this.sun.shadow.camera,{left:-span/2-3,right:span/2+3,top:span/2+3,bottom:-span/2-3,near:.1,far:180});this.sun.position.set(-span*.25,Math.max(14,span),span*.25);this.sun.shadow.camera.updateProjectionMatrix();this.rig.setTrack(track);this.dirty=true;
 }
 setView(view){this.rig.setMode(view);this.dirty=true;}
 setGarage(flag,appearance,upgrades){this.garage=flag;this.rig.garage=flag;this.rig.initial=true;if(flag)this.garageCar={id:'workshop',name:'GT-08',ai:true,color:appearance.paint,appearance,upgrades};else{this.clearCars();this.camera.clearViewOffset();this.scene.background=this.sky;}this.dirty=true;}
 setGarageView(angle){this.rig.garageAngle=angle;this.dirty=true;}
 disposeCar(root){root.removeFromParent();const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.userData.ownGeometry)gs.add(o.geometry);if(o.userData.ownMaterial){if(o.userData.beacon)o.material.map?.dispose();ms.add(o.material);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 clearCars(){for(const root of this.cars.values())this.disposeCar(root);this.cars.clear();}
 modelFor(car){const look=effectiveParts(car),key=JSON.stringify([look,car.color]),old=this.cars.get(car.id);if(old&&old.userData.key===key)return old;if(old)this.disposeCar(old);
  const root=this.sourceCar?this.batch(this.sourceCar,o=>!hiddenStockPart(o.name,look)):this.prototype.clone(true);root.userData.key=key;root.rotation.order='YZX';
  root.traverse(o=>{if(o.isMesh&&o.material.name.startsWith('MAT_lime_enamel')){o.material=o.material.clone();o.material.color.set(car.color);o.userData.ownMaterial=true;}});addCarStyle(root,car,this.kit);
  if(!car.ai){const label=document.createElement('canvas');label.width=96;label.height=64;const ctx=label.getContext('2d');ctx.fillStyle=car.color;ctx.beginPath();ctx.roundRect(9,3,78,46,12);ctx.fill();ctx.beginPath();ctx.moveTo(39,49);ctx.lineTo(48,62);ctx.lineTo(57,49);ctx.fill();ctx.fillStyle='#11151d';ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillText(car.id==='player'?'P1':car.id.toUpperCase(),48,36);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(label),depthTest:false,depthWrite:false,toneMapped:false}));sprite.userData.ownMaterial=true;sprite.userData.beacon=true;sprite.renderOrder=10;root.add(sprite);root.userData.beacon=sprite;}
  this.scene.add(root);this.cars.set(car.id,root);return root;
 }
 resize(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(!width||!height)return;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.dirty=true;}
 render(session,alpha=1){const now=performance.now(),rawDt=(now-this.lastTime)/1000,dt=Math.min(.05,rawDt);this.lastTime=now;
  if(session.status==='running'&&dt>0){this.frameSamples.push(rawDt);if(this.frameSamples.length>180)this.frameSamples.shift();}
  if(session.track!==this.track){this.clearCars();this.setTrack(session.track);}
  this.staticRoot.visible=!this.garage;this.ground.visible=!this.garage;this.stage.visible=this.garage;this.garageLight.intensity=this.garage?1.2:0;this.skidEffects.ink.visible=!this.garage;this.skidEffects.smoke.visible=!this.garage;
  if(this.garage&&!this.dirty)return;
  if(this.garage){this.dirty=false;this.scene.background=this.garageBackground;this.scene.fog=null;for(const m of this.cars.values())m.visible=false;const car=this.modelFor(this.garageCar);car.visible=true;car.position.set(0,.018,0);car.rotation.set(0,0,0);this.marker.visible=false;this.switchGlow.visible=false;this.brakeMarks.visible=false;this.rig.update(session,dt);this.renderer.render(this.scene,this.camera);return;}
  if(!this.scene.fog)this.scene.fog=new THREE.Fog((THEMES[this.track.theme]??THEMES.forest).sky,35,160);
  if(this.raceCars!==session.cars){this.raceCars=session.cars;this.skidEffects.reset();}this.skidEffects.update(session.cars,session.status==='running'?dt:0);this.world.update(dt,this.rig.mode,['running','ready'].includes(session.status));this.rig.update(session,dt);
  const ids=new Set(session.cars.map(c=>c.id));for(const [id,m]of this.cars)if(!ids.has(id)){this.disposeCar(m);this.cars.delete(id);}
  for(const car of session.cars){const m=this.modelFor(car),p=car.pose;m.visible=true;const beacon=m.userData.beacon;if(beacon){beacon.visible=session.isLocal;const size=['top','iso'].includes(this.rig.mode)?Math.max(.65,this.camera.position.y*.022):.5;beacon.position.set(0,.35,0);beacon.scale.set(size,size*2/3,1);}
   if(car.crash){const c=car.crash;m.position.set(c.x,c.z,c.y);m.rotation.set(Math.min(.7,Math.abs(c.spin)*.07),-c.angle,0);}
   else{const prev=car.previousPose??p,blend=(a,b)=>a+(b-a)*alpha;const body=bodyPose({...p,x:blend(prev.x,p.x),y:blend(prev.y,p.y),z:blend(prev.z,p.z)},blend(car.previousDrift??car.driftAngle,car.driftAngle));m.position.set(body.x,.077+body.z,body.y);m.rotation.set(p.bank||0,-body.angle,p.pitch||0);}
   if(car===session.player){this.marker.position.copy(m.position);this.marker.position.y+=.005;this.marker.visible=car.state==='slotted'&&this.rig.mode!=='drone';}
  }
  this.switchGlow.visible=session.player.switchQueued;if(this.switchGlow.visible){const p=this.track.sample(session.player.distance+this.track.nextSwitchDistance(session.player.distance));this.switchGlow.position.set(p.x,p.z+.09,p.y);}
  const advice=session.player.coach;this.brakeMarks.visible=!!(session.guidanceEnabled&&advice&&advice.point!==null&&advice.action!=='go'&&session.status==='running');
  if(this.brakeMarks.visible){for(let i=0;i<5;i++){const p=this.track.sample(session.player.distance+Math.max(.25,advice.distanceToBrake)+i*.24);this.brakeTransform.position.set(p.x,p.z+.087,p.y);this.brakeTransform.rotation.set(-Math.PI/2,0,-Math.atan2(p.ty,p.tx));this.brakeTransform.updateMatrix();this.brakeMarks.setMatrixAt(i,this.brakeTransform.matrix);}this.brakeMarks.instanceMatrix.needsUpdate=true;this.brakeMarks.material.color.set(advice.action==='brake'?0xff604b:0xffc85a);}
  this.renderer.render(this.scene,this.camera);
 }
 stats(){return{fps:this.frameSamples.length/(this.frameSamples.reduce((a,b)=>a+b,0)||1),type:'3d',camera:this.rig.mode,calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries};}
 disposeRoot(root){const gs=new Set(),ms=new Set();root?.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.sharedAssets)return;if(o.userData.ownTexture)o.material?.map?.dispose();if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 destroy(){this.disposed=true;this.clearCars();this.skidEffects.destroy();this.resizeObserver.disconnect();this.canvas.removeEventListener('webglcontextlost',this.lost);this.canvas.removeEventListener('webglcontextrestored',this.restored);this.disposeRoot(this.scene);this.disposeRoot(this.sourceCar);this.disposeRoot(this.assetSource);this.disposeRoot(this.prototype);this.kit?.destroy();this.sky?.dispose();this.renderer.dispose();}
}
