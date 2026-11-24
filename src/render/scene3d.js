import {precipitation} from './precipitation.js';
const WEATHER_LIGHT={
 rain:{key:'#bed0df',fill:'#9eaeba',power:.57,near:9,far:58},
 snow:{key:'#e1efff',fill:'#ccdce7',power:.75,near:7,far:49},
 sand:{key:'#ffd394',fill:'#cba779',power:.78,near:8,far:51},
 heat:{key:'#ffe0a8',fill:'#dfcba7',power:1.12,near:19,far:82}
};
import {installedGroup,fittingTravel,mechanicalView,inspectionShell} from './installation.js';
import {diffuserVertices,diffuserTriangles} from './portal-mesh.js';
import {QualityGovernor,renderSize} from './quality.js';
import {vividPaint,lacquerTexture} from './paint-finish.js';
import * as THREE from 'three';
import { VehicleModels } from './vehicle-models.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { installHardware,atelierRoom,reflectionMap } from './atelier.js';
import { clubRoom } from './club-room.js';
import { buildModularTrack } from './modular-track.js';
import { MiniatureWorld, THEMES, skyTexture } from './world.js';
import { lightingProfile } from './atmosphere.js';
import { AssetKit } from './asset-kit.js';
import { carSurface, installCarMotion, updateCarMotion } from './wheel-motion.js';
import { addCarStyle, hiddenStockPart } from './car-style.js';
import { effectiveParts } from '../game/workshop.js';
import { CameraRig } from '../camera/rig.js';
import { racePose } from './race-pose.js';
import { ConductorGlints } from './conductor-glints.js';
import { ImpactEffects } from './impact.js';
import { SkidEffects } from './skid-effects.js';

export class Scene3D {
 constructor(canvas,track,{onStatus,onLost,onRestored}={}){
  this.kind='3d';this.canvas=canvas;this.track=track;this.onStatus=onStatus;this.cars=new Map();this.frameSamples=[];this.disposed=false;this.lastTime=performance.now();this.garage=false;this.garageBackground=new THREE.Color('#111d29');
  this.mobile = window.matchMedia('(pointer: coarse) and (max-width: 1100px)').matches;this.quality=new QualityGovernor();
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.raceFrustum=new THREE.Frustum();this.clipMatrix=new THREE.Matrix4();this.carSphere=new THREE.Sphere(new THREE.Vector3(),1);
  this.scene=new THREE.Scene();this.fallbackEnvironment=reflectionMap();this.scene.environment=this.fallbackEnvironment;
  new THREE.TextureLoader().load(new URL('../../assets/club-light.webp',import.meta.url).href,texture=>{
    if(this.disposed){texture.dispose();return;}
    texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
    this.clubPanorama=texture;this.applyLighting();
    this.dirty=true;
  });this.atelier=atelierRoom();this.atelier.visible=false;this.scene.add(this.atelier);this.camera=new THREE.PerspectiveCamera(48,1,.02,500);this.rig=new CameraRig(this.camera,track);
  this.hemi=new THREE.HemisphereLight(0xe8f4ff,0xb39b7f,1.85);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight(0xffedd2,2.4);this.sun.position.set(-5,14,6);this.sun.castShadow=true;this.sun.shadow.mapSize.setScalar(this.mobile ? 1024 : 1536);this.sun.shadow.bias=-.00013;this.sun.shadow.normalBias=.006;this.scene.add(this.sun);this.scene.add(this.sun.target);
  this.fill=new THREE.DirectionalLight(0xbde8ff,.45);this.fill.position.set(5,4,-6);this.scene.add(this.fill);this.scene.add(this.fill.target);
  this.ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({color:'#8b795f',roughness:.9}));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-.45;this.ground.receiveShadow=true;this.scene.add(this.ground);
  this.prototype=this.fallbackCar();
  this.switchGlow=new THREE.Mesh(new THREE.RingGeometry(.4,.46,40),new THREE.MeshBasicMaterial({color:0x78f6da,transparent:true,opacity:.75,depthWrite:false}));this.switchGlow.rotation.x=-Math.PI/2;this.scene.add(this.switchGlow);
  this.glints=new ConductorGlints();this.scene.add(this.glints.root);
  this.skidEffects=new SkidEffects(this.scene);this.impacts=new ImpactEffects(this.scene);
  this.brakeMarks=new THREE.InstancedMesh(new THREE.PlaneGeometry(.075,.63),new THREE.MeshBasicMaterial({color:0xffa34d,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}),5);this.brakeTransform=new THREE.Object3D();this.scene.add(this.brakeMarks);
  this.stage=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,.035,64),new THREE.MeshStandardMaterial({color:'#50616d',metalness:.5,roughness:.25}));this.stage.position.y=-.018;this.stage.receiveShadow=true;this.stage.visible=false;this.scene.add(this.stage);
  this.garageLight=new THREE.PointLight(0xc4ecff,0,3);this.garageLight.position.set(.3,.65,.3);this.scene.add(this.garageLight);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  this.lost=e=>{e.preventDefault();onLost?.();};this.restored=()=>{this.resize();onRestored?.();};canvas.addEventListener('webglcontextlost',this.lost);canvas.addEventListener('webglcontextrestored',this.restored);this.ready=this.loadAssets();
 }
 batch(root,filter=()=>true){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||!filter(o))return;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld),role=carSurface(o.name),key=o.material.uuid+role+Object.keys(g.attributes).join(',');if(!buckets.has(key))buckets.set(key,{material:o.material,role,geometries:[]});buckets.get(key).geometries.push(g);});const group=new THREE.Group();for(const {material,role,geometries}of buckets.values()){const geo=mergeGeometries(geometries);if(geo){const m=new THREE.Mesh(geo,material);m.userData.carSurface=role;m.castShadow=true;m.receiveShadow=true;m.userData.ownGeometry=true;group.add(m);}geometries.forEach(g=>g.dispose());}return group;}
 async loadAssets(){
  this.fleet=new VehicleModels(()=>{this.dirty=true;});
  const result=await Promise.allSettled([this.fleet.load(0),new AssetKit().load()]);
  if(this.disposed){if(result[1].status==='fulfilled')result[1].value.destroy();return;}
  if(result[1].status==='fulfilled')this.kit=result[1].value;
  this.dirty=true;this.onStatus?.(this.kit&&this.fleet.templates.size?'SCUDERIA · BLENDER 3D':'3D ESSENZIALE · ASSET NON DISPONIBILI');
  for(const r of result)if(r.status==='rejected')console.warn('Asset fallback',r.reason);
 }
 contactShadow(){
  if(this.shadowTexture)return this.shadowTexture;
  const edge=64,data=new Uint8Array(edge*edge*4);
  for(let y=0;y<edge;y++)for(let x=0;x<edge;x++){const u=(x+.5)/edge*2-1,v=(y+.5)/edge*2-1,r=Math.pow(u**4+v**4,.25),a=Math.max(0,1-r*r);data.set([8,12,15,Math.round(a*a*230)],(y*edge+x)*4);}
  const map=new THREE.DataTexture(data,edge,edge);map.needsUpdate=true;this.shadowTexture=map;return map;
 }
 fallbackCar(){const root=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.065,.15),new THREE.MeshStandardMaterial({name:'MAT_lime_enamel',color:0xc6f568,roughness:.25}));b.position.y=.06;root.add(b);const r=new THREE.Mesh(new THREE.BoxGeometry(.13,.045,.10),new THREE.MeshStandardMaterial({color:0x152b38}));r.position.y=.11;root.add(r);return root;}
 setTrack(track){this.trackEnvironmentTarget?.dispose();this.trackEnvironmentTarget=null;this.environmentPending=true;this.track=track;if(this.staticRoot){this.scene.remove(this.staticRoot);this.disposeRoot(this.staticRoot);}this.staticRoot=buildModularTrack(track,this.kit);this.precip=precipitation(track);if(this.precip)this.staticRoot.add(this.precip);this.staticRoot.updateMatrixWorld(true);this.staticRoot.traverse(o=>{o.matrixAutoUpdate=false;});this.world=new MiniatureWorld(track,this.kit);this.staticRoot.add(this.world.root);if(track.meeting)this.staticRoot.add(clubRoom(track));this.scene.add(this.staticRoot);
  const theme=THEMES[track.theme]??THEMES.forest;this.sky?.dispose();this.sky=skyTexture(track.theme,track.index,this.mobile,track.meeting?.world);this.scene.background=this.sky;this.raceFog=new THREE.Fog(theme.sky,28,102);this.scene.fog=this.raceFog;this.ground.material.color.set(theme.floor);this.applyLighting();this.rig.setTrack(track);this.tuneTextures();this.dirty=true;
 }
 applyLighting(){
  if(!this.sun||!this.track)return;
  const b=this.track.bounds,garage=this.garage,club=garage;
  const profile=lightingProfile(this.track.theme,this.track.index,club);
  const x=garage?0:(b.minX+b.maxX)/2,z=garage?0:(b.minY+b.maxY)/2;
  const radius=garage?3:.52*Math.hypot(b.maxX-b.minX,b.maxY-b.minY)+3;
  const reach=radius*1.8,dx=reach*Math.cos(profile.azimuth),dz=reach*Math.sin(profile.azimuth);
  this.sun.target.position.set(x,0,z);
  this.sun.position.set(x+dx,reach*Math.tan(profile.altitude),z+dz);
  this.sun.color.set(garage?'#fff2e5':profile.key);this.sun.intensity=garage?2.6:profile.power;
  this.hemi.color.set(garage?'#e8f1ff':profile.sky);this.hemi.groundColor.set(profile.bounce);this.hemi.intensity=profile.ambient;
  this.fill.target.position.set(x,0,z);this.fill.position.set(x-dx*.6,reach*.35,z-dz*.6);this.fill.intensity=garage?.65:profile.fill;this.renderer.toneMappingExposure=garage?1.12:1.23;
  const sky=garage?null:WEATHER_LIGHT[this.track.weather];
  if(sky&&this.raceFog){
    this.sun.color.set(sky.key);this.sun.intensity*=sky.power;
    this.hemi.color.set(sky.fill);this.raceFog.color.set(sky.fill);
    this.raceFog.near=sky.near;this.raceFog.far=sky.far;
  }
  Object.assign(this.sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,near:.1,far:reach*3+10});
  this.sun.shadow.camera.updateProjectionMatrix();
  this.scene.environment=garage?(this.clubPanorama??this.fallbackEnvironment):(this.trackEnvironmentTarget?.texture??(club?(this.clubPanorama??this.fallbackEnvironment):this.sky));
  this.scene.environmentIntensity=garage?.95:club?.94:.84;
 }
 captureTrackEnvironment(){
  if(this.quality.id==='race60'||!this.environmentPending||!this.kit||this.garage)return;
  this.environmentPending=false;
  const target=new THREE.WebGLCubeRenderTarget(this.quality.profile.probe,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  const probe=new THREE.CubeCamera(.08,160,target),b=this.track.bounds;
  probe.position.set((b.minX+b.maxX)/2,2.1,(b.minY+b.maxY)/2);
  const hidden=[...this.cars.values(),this.switchGlow,this.glints.root,this.skidEffects.ink,this.skidEffects.smoke,this.brakeMarks].filter(Boolean);
  const visibility=hidden.map(o=>o.visible);hidden.forEach(o=>o.visible=false);
  const environment=this.scene.environment;
  try{
   // A single static probe per circuit includes buildings, foliage and barriers.
   // It is not a per-frame mirror or a reflection of moving competitors.
   this.scene.environment=this.sky;probe.update(this.renderer,this.scene);
   this.trackEnvironmentTarget=target;this.applyLighting();
  }catch(error){target.dispose();this.scene.environment=environment;console.warn('Riflessi ambiente semplificati',error);}
  finally{hidden.forEach((o,i)=>o.visible=visibility[i]);}
 }
 setView(view){this.rig.setMode(view);this.dirty=true;}
 fitPart(key){this.fit={key,start:performance.now()};this.dirty=true;}
 setGarage(flag,appearance,upgrades,chassis=0){if(this.garage!==flag){this.rig.initial=true;this.fit=null;this.garageEntry=performance.now();}this.garage=flag;this.rig.garage=flag;this.applyLighting();if(flag)this.garageCar={id:'workshop',name:'GT-08',ai:true,color:appearance.paint,appearance,upgrades,chassis};else{this.clearCars();this.camera.clearViewOffset();this.scene.background=this.sky;}this.dirty=true;}
 setGarageView(angle){this.rig.detail=null;this.rig.zoom=1;this.rig.elevation=.28;this.rig.garageAngle=angle;this.rig.manual=true;this.dirty=true;}
 centerGarage(){this.setGarageView(.65);this.rig.initial=true;}
 inspect(key){this.rig.detail=key;this.rig.manual=true;this.rig.zoom=1;this.rig.garageAngle=key==='wing'||key==='motor'?2.5:.65;this.rig.elevation=['brake','under','grip','brush','gearing','diffuser'].includes(key)?-.65:key==='motor'?-.30:.28;this.dirty=true;}
 orbit(dx,dy){this.rig.manual=true;this.rig.garageAngle=(this.rig.garageAngle??.8)+dx;this.rig.elevation=THREE.MathUtils.clamp((this.rig.elevation??.45)+dy,-1.3,1.35);this.dirty=true;}
 magnify(factor){this.rig.zoom=THREE.MathUtils.clamp((this.rig.zoom||1)*factor,.6,2.1);this.dirty=true;}
 disposeCar(root){root.removeFromParent();const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.userData.ownGeometry)gs.add(o.geometry);if(o.userData.ownMaterial){if(o.userData.beacon)o.material.map?.dispose();ms.add(o.material);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 clearCars(){for(const root of this.cars.values())this.disposeCar(root);this.cars.clear();}
 modelFor(car){const source=this.fleet?.forChassis(car.chassis),existing=this.cars.get(car.id);if(car.id!=='workshop'&&existing?.userData.owner===car&&existing.userData.sourceId===source?.uuid)return existing;const look=effectiveParts(car),key=JSON.stringify([source?.uuid,look,car.color,car.chassis,car.upgrades,car.id==='workshop'&&this.rig.detail]),old=this.cars.get(car.id);if(old&&old.userData.key===key)return old;if(old)this.disposeCar(old);
  const root=source?this.batch(source,o=>!hiddenStockPart(o.name,look)&&!(car.id==='workshop'&&this.rig.detail==='glass'&&/^GT_(roof|glazing)/.test(o.name))):this.prototype.clone(true);root.userData.key=key;root.userData.owner=car;root.userData.sourceId=source?.uuid;root.rotation.order='YZX';
  root.traverse(o=>{if(o.isMesh&&/^(MAT_lime_enamel|MAT_smoked_glass|MAT_seat)/.test(o.material.name)){o.material=o.material.clone();o.material.color.set(o.material.name.startsWith("MAT_smoked_glass")?look.glass:o.material.name.startsWith("MAT_seat")?look.seat:vividPaint(car.color??look.paint));o.userData.ownMaterial=true;}});addCarStyle(root,car,this.kit);
  root.traverse(node=>{
   const m=node.material;
   if(m?.isMeshPhysicalMaterial&&m.name.startsWith('MAT_lime_enamel')&&node.geometry.attributes.uv){
    m.clearcoatNormalMap=this.lacquer??=lacquerTexture();m.clearcoatNormalScale.setScalar(.055);
   }
  });installHardware(root,car,source?.userData.hasSeats);installCarMotion(root,source);
  const fins=new THREE.BufferGeometry();fins.setAttribute('position',new THREE.Float32BufferAttribute(diffuserVertices,3));fins.setIndex(diffuserTriangles);fins.computeVertexNormals();
  const diffuser=new THREE.Mesh(fins,new THREE.MeshStandardMaterial({color:'#424950',metalness:.52,roughness:.3,side:THREE.DoubleSide}));
  diffuser.name='Estrattore in carbonio';diffuser.userData.ownMaterial=true;diffuser.userData.ownGeometry=true;root.add(diffuser);
  if(car.id==='workshop'){
    if(mechanicalView(this.rig.detail))root.traverse(node=>{
      if(!node.isMesh||installedGroup(node)||!(inspectionShell(node.name,node.material.name)||node.userData.ownGeometry))return;
      if(!node.userData.ownMaterial){node.material=node.material.clone();node.userData.ownMaterial=true;}
      node.material.transparent=true;node.material.opacity=.18;node.material.depthWrite=false;
    });
    root.userData.fittings=[];
    for(const node of root.children){const group=installedGroup(node);if(!group)continue;
      const parts=group==='wheels'&&node.children.length?node.children:[node];
      for(const part of parts)root.userData.fittings.push({node:part,group,base:part.position.clone()});}
  }
  root.userData.bodyBounds=new THREE.Box3().setFromObject(root);
  if(!car.ai){const label=document.createElement('canvas');label.width=96;label.height=64;const ctx=label.getContext('2d');ctx.fillStyle=car.color;ctx.beginPath();ctx.roundRect(9,3,78,46,12);ctx.fill();ctx.beginPath();ctx.moveTo(39,49);ctx.lineTo(48,62);ctx.lineTo(57,49);ctx.fill();ctx.fillStyle='#11151d';ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillText(car.id==='player'?'P1':car.id.toUpperCase(),48,36);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(label),depthTest:false,depthWrite:false,toneMapped:false}));sprite.userData.ownMaterial=true;sprite.userData.beacon=true;sprite.renderOrder=10;root.add(sprite);root.userData.beacon=sprite;}
  const shade=new THREE.Mesh(new THREE.PlaneGeometry(.34,.19),new THREE.MeshBasicMaterial({map:this.contactShadow(),transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  shade.rotation.x=-Math.PI/2;shade.position.y=.0012;shade.userData.ownGeometry=true;shade.userData.ownMaterial=true;shade.name='Ombra di contatto';root.add(shade);root.userData.contactShadow=shade;
  this.scene.add(root);this.cars.set(car.id,root);return root;
 }
 setQuality(id){
  this.quality.setProfile(id);const p=this.quality.profile,size=this.mobile?p.mobileShadow:p.shadow;
  if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.setScalar(size);this.sun.shadow.needsUpdate=true;}
  this.trackEnvironmentTarget?.dispose();this.trackEnvironmentTarget=null;this.environmentPending=true;this.applyLighting();this.tuneTextures();this.resize();
 }
 tuneTextures(){
  if(!this.renderer||!this.scene)return;
  const max=Math.min(this.renderer.capabilities.getMaxAnisotropy(),this.quality.profile.anisotropy);
  this.scene.traverse(o=>{for(const m of [o.material].flat().filter(Boolean)){m.userData.anisotropy=max;for(const key of ['map','normalMap','roughnessMap','bumpMap']){const t=m[key];if(t&&t.anisotropy!==max){t.anisotropy=max;t.needsUpdate=true;}}}});
 }
 resize(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(!width||!height)return;
  const size=renderSize({width,height,dpr:devicePixelRatio||1,mobile:this.mobile,profile:this.quality.id,scale:this.quality.scale,maxSize:this.renderer.capabilities.maxTextureSize});
  this.renderer.setPixelRatio(size.ratio);this.renderer.setSize(width,height,false);this.drawSize=size;
  this.rig.mobileRace=width<=650 || (width<=1100 && (this.mobile || height<=550));
  this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.dirty=true;
 }
 submitFrame(rawDt){
  const frameDelta=this.lastSubmitted===undefined?rawDt:(this.lastTime-this.lastSubmitted)/1000;this.lastSubmitted=this.lastTime;
  if(frameDelta>0&&frameDelta<.2){this.frameSamples.push(frameDelta);if(this.frameSamples.length>180)this.frameSamples.shift();}
  // Contact patches follow each car every frame; refresh the costly scene shadow less often on mobile.
  this.renderer.shadowMap.enabled=this.garage||this.quality.id!=='race60';
  this.renderer.shadowMap.autoUpdate=this.garage;
  if(!this.garage && (this.shadowTrack!==this.track || !this.lastShadow || this.lastTime-this.lastShadow>=(this.mobile?125:40))){
    this.renderer.shadowMap.needsUpdate=true;this.lastShadow=this.lastTime;this.shadowTrack=this.track;
  }
  this.renderer.render(this.scene,this.camera);
  const cost=performance.now()-this.lastTime;
  if(this.quality.sample(rawDt,cost))this.resize();
 }
 render(session,alpha=1){const now=performance.now(),rawDt=(now-this.lastTime)/1000,dt=Math.min(.05,rawDt);this.lastTime=now;
  if(!this.garage&&(!this.staticRoot||session.track!==this.track)){this.clearCars();this.setTrack(session.track);}
  if(this.garage)this.glints.root.visible=false;
  this.atelier.visible=this.garage;if(this.staticRoot)this.staticRoot.visible=!this.garage;this.ground.visible=!this.garage;this.stage.visible=this.garage;this.garageLight.intensity=this.garage?1.2:0;this.skidEffects.ink.visible=!this.garage;this.skidEffects.smoke.visible=!this.garage;
  this.impacts.update(session.cars,!this.garage&&!this.rig.motion.matches);
  if(this.garage&&!this.dirty&&this.rig.motion.matches)return;
  if(this.garage){this.dirty=false;this.scene.background=this.garageBackground;this.scene.fog=null;for(const m of this.cars.values())m.visible=false;const car=this.modelFor(this.garageCar);car.visible=true;car.position.set(0,.23,0);const entry=this.rig.motion.matches?0:Math.max(0,1-(now-this.garageEntry)/680)**3;
   car.rotation.set(0,-.32*entry,0);
   const travel=fittingTravel(this.fit?.key,now-(this.fit?.start??0));
   for(const {node,group,base} of car.userData.fittings??[]){
     node.position.copy(base);
     if(group===this.fit?.key){node.position.x+=travel[0];node.position.y+=travel[1];node.position.z+=travel[2]*(base.z<0?-1:1);}
   }
   if(this.rig.elevation<0)this.stage.visible=false;
   this.rig.garageBounds=car.userData.bodyBounds;this.switchGlow.visible=false;this.brakeMarks.visible=false;this.rig.update(session,dt);this.submitFrame(rawDt);return;}
  if(!this.scene.fog)this.scene.fog=this.raceFog;
  if(this.raceCars!==session.cars){this.raceCars=session.cars;this.skidEffects.reset();const active=new Set(session.cars.map(car=>car.id));for(const [id,model] of this.cars){if(!active.has(id)){this.disposeCar(model);this.cars.delete(id);}}}this.skidEffects.update(session.cars,session.status==='running'?dt:0,this.camera,this.track.weather==='rain');this.world.update(dt,this.rig.mode,['running','ready'].includes(session.status),session.players.some(c=>this.track.tunnelAt?.(c.distance,1.8)));this.rig.update(session,dt,alpha);
  if(this.precip){
   this.precip.visible=['countdown','running','paused'].includes(session.status);
   if(!this.rig.motion.matches && session.status!=='paused')this.precip.material.uniforms.clock.value=(session.elapsed+3-session.countdown)%3600;
  }
  const lit=session.status==='countdown'?Math.min(5,1+Math.floor((3-session.countdown)*2)):0;
  for(const [i,mat] of (this.staticRoot.userData.startLights??[]).entries())mat.emissiveIntensity=i<lit?2.7:0;
  this.glints.update(session,this.camera,this.sun,session.status==='running'&&!this.rig.motion.matches);
  this.camera.updateMatrixWorld();
  this.raceFrustum.setFromProjectionMatrix(this.clipMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
  for(const car of session.cars){
   const point=car.crash??car.pose;
   this.carSphere.center.set(point.x,point.z,point.y);
   if(car.state==='eliminated'||!this.raceFrustum.intersectsSphere(this.carSphere)){
    const existing=this.cars.get(car.id);if(existing)existing.visible=false;
    continue;
   }
   const m=this.modelFor(car),p=car.pose;updateCarMotion(m,car,dt,alpha);m.visible=car.state!=='eliminated';if(m.userData.contactShadow)m.userData.contactShadow.visible=!car.crash;const beacon=m.userData.beacon;if(beacon){beacon.visible=session.isLocal;const size=['top','iso'].includes(this.rig.mode)?Math.max(.65,this.camera.position.y*.022):.5;beacon.position.set(0,.35,0);beacon.scale.set(size,size*2/3,1);}
   if(car.crash){const c=car.crash;m.position.set(c.x,c.z,c.y);m.rotation.set(c.roll||0,-c.angle,0,"YXZ");}
   else{const body=racePose(car,alpha);const pitch=body.loopPitch??0,shift=.077*Math.sin(pitch),roll=body.stuntRoll||0,side=.077*Math.sin(roll);m.position.set(body.x-body.tx*shift+body.nx*side,body.z+.077*Math.cos(pitch)*Math.cos(roll),body.y-body.ty*shift+body.ny*side);const load=Math.min(1,car.gripRatio||0)*Math.sign(p.curvature||0);
    m.userData.lean=THREE.MathUtils.damp(m.userData.lean||0,load*.034,11,dt);
    m.rotation.set((body.bank||0)+(body.stuntRoll||0)+m.userData.lean,-body.angle,body.pitch||0,"YZX");}
  }
  this.switchGlow.visible=session.player.switchQueued;if(this.switchGlow.visible){const p=this.track.sample(session.player.distance+this.track.nextSwitchDistance(session.player.distance));this.switchGlow.position.set(p.x,p.z+.09,p.y);}
  const advice=session.player.coach;this.brakeMarks.visible=!!(session.guidanceEnabled&&advice&&advice.point!==null&&advice.action!=='go'&&session.status==='running');
  if(this.brakeMarks.visible){for(let i=0;i<5;i++){const p=this.track.sample(session.player.distance+Math.max(.25,advice.distanceToBrake)+i*.24);this.brakeTransform.position.set(p.x,p.z+.087,p.y);this.brakeTransform.rotation.set(-Math.PI/2,0,-Math.atan2(p.ty,p.tx));this.brakeTransform.updateMatrix();this.brakeMarks.setMatrixAt(i,this.brakeTransform.matrix);}this.brakeMarks.instanceMatrix.needsUpdate=true;this.brakeMarks.material.color.set(advice.action==='brake'?0xff604b:0xffc85a);}
  this.submitFrame(rawDt);this.captureTrackEnvironment();
 }
 stats(){return{fps:performance.now()-(this.lastSubmitted??0)>500?0:this.frameSamples.length/(this.frameSamples.reduce((a,b)=>a+b,0)||1),type:'3d',width:this.canvas.width,height:this.canvas.height,scale:this.quality.scale,profile:this.quality.id,targetFps:this.quality.profile.fps,camera:this.rig.mode,calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries};}
 disposeRoot(root){const gs=new Set(),ms=new Set();root?.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.sharedAssets)return;if(o.userData.ownTexture)o.material?.map?.dispose();if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 destroy(){this.disposed=true;this.clearCars();this.impacts.destroy();this.skidEffects.destroy();this.resizeObserver.disconnect();this.canvas.removeEventListener('webglcontextlost',this.lost);this.canvas.removeEventListener('webglcontextrestored',this.restored);this.disposeRoot(this.scene);this.fleet?.destroy();this.disposeRoot(this.prototype);this.kit?.destroy();this.lacquer?.dispose();this.shadowTexture?.dispose();this.trackEnvironmentTarget?.dispose();this.fallbackEnvironment?.dispose();this.clubPanorama?.dispose();this.sky?.dispose();this.renderer.dispose();}
}
