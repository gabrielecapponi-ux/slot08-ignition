import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFile} from 'node:fs/promises';
register('../scripts/three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {VehicleModels}=await import('../src/render/vehicle-models.js');
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
const {fitShowroom}=await import('../src/camera/showroom.js');
const {vividPaint}=await import('../src/render/paint-finish.js');
const views=[{w:1365,h:930,left:408,right:1341,top:144,bottom:778},{w:390,h:844,left:10,right:380,top:116,bottom:391},{w:844,h:390,left:301,right:820,top:110,bottom:296},{w:320,h:568,left:10,right:310,top:116,bottom:232}];

test('all nine cars stay centred and fully framed through showroom rotation on desktop and mobile',async()=>{
 const fleet=new VehicleModels(),loader=new GLTFLoader();
 fleet.loader.loadAsync=async url=>{const bytes=await readFile(new URL(url));return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
 for(let id=0;id<9;id++){
  const root=await fleet.load(id),box=new THREE.Box3().setFromObject(root);
  for(const v of views)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8){
   const frame={x:(v.left+v.right)/2/v.w,y:(v.top+v.bottom)/2/v.h,width:(v.right-v.left)/v.w,height:(v.bottom-v.top)/v.h};
   const {eye,target,fov}=fitShowroom(box,angle,.28,v.w/v.h,frame),camera=new THREE.PerspectiveCamera(fov,v.w/v.h,.01,10);
   camera.setViewOffset(v.w,v.h,v.w*(.5-frame.x),v.h*(.5-frame.y),v.w,v.h);camera.position.copy(eye);camera.lookAt(target);camera.updateMatrixWorld();
   const center=target.clone().project(camera);assert.ok(Math.abs((center.x+1)/2-frame.x)<1e-8);assert.ok(Math.abs((1-center.y)/2-frame.y)<1e-8);
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const p=new THREE.Vector3(x,y+.23,z).project(camera),px=(p.x+1)*v.w/2,py=(1-p.y)*v.h/2;
    assert.ok(px>=v.left&&px<=v.right&&py>=v.top&&py<=v.bottom,`chassis ${id} clipped at ${v.w} / ${angle}`);
   }
  }
 }
 fleet.destroy();
});
test('richer enamel preserves hue and neutral paints',()=>{
 for(const value of ['#c6f568','#8bbcff','#ef6763','#f1cf68']){const before={},after={};new THREE.Color(value).getHSL(before,THREE.SRGBColorSpace);vividPaint(value).getHSL(after,THREE.SRGBColorSpace);assert.ok(after.s>=before.s-1e-6);assert.ok(after.l<before.l);assert.ok(Math.abs(after.h-before.h)<1e-6);}
 assert.equal(vividPaint('#cccccc').getHexString(),'cccccc');
});

// The car remains centred after camera interpolation, including tunnel clearance.
test('following camera centres the car through turns on portrait and landscape screens',async()=>{
 globalThis.window={matchMedia:()=>({matches:false})};
 const {CameraRig}=await import('../src/camera/rig.js');
 const track={bounds:{minX:-10,maxX:10,minY:-10,maxY:10},tunnelAt:()=>false};
 for(const aspect of [390/844,1365/930]){
  const camera=new THREE.PerspectiveCamera(48,aspect,.01,100),rig=new CameraRig(camera,track);
  const player={pose:{x:0,y:0,z:0,angle:0},speed:4,distance:0,lane:1};
  const session={player,status:'racing',isLocal:false};
  for(let step=0;step<32;step++){
   player.pose={x:Math.cos(step*.12)*3,y:Math.sin(step*.12)*3,z:.2,angle:step*.12};
   track.tunnelAt=()=>step>=16;rig.update(session,1/60);camera.updateMatrixWorld();
   const p=new THREE.Vector3(player.pose.x,player.pose.z+.135,player.pose.y).project(camera);
   assert.ok(Math.abs(p.x)<1e-8&&Math.abs(p.y)<1e-8,'following view drifted away from car');
  }
 }
 delete globalThis.window;
});

test('camera and car use one interpolated instant at 60 and 120 fps across banked bends',async()=>{
 globalThis.window={matchMedia:()=>({matches:false})};
 const {CameraRig}=await import('../src/camera/rig.js');
 const {racePose}=await import('../src/render/race-pose.js');
 const {createTrack}=await import('../src/track/catalog.js');
 const track=createTrack(5,{lanes:4,variant:13});
 for(const hz of [60,120]){
  const camera=new THREE.PerspectiveCamera(48,390/844,.01,100),rig=new CameraRig(camera,track);
  const player={speed:3,lane:1,state:'slotted',previousState:'slotted',distance:0,driftAngle:.1,previousDrift:.095};
  const session={player,status:'running',isLocal:false};
  for(let i=1;i<120;i++){
   const distance=track.length*i/120;player.distance=distance;player.pose=track.pose(distance,1);player.previousPose=track.pose(distance-.025,1);
   for(const alpha of [.1,.5,.9]){rig.update(session,1/hz,alpha);camera.updateMatrixWorld();const body=racePose(player,alpha),screen=new THREE.Vector3(body.x,body.z+.135,body.y).project(camera);assert.ok(Math.abs(screen.x)<1e-8&&Math.abs(screen.y)<1e-8);}
  }
 }
 delete globalThis.window;
});

test('start camera rotates around the car rather than crossing through its body',async()=>{
 const {smoothCameraArm}=await import('../src/camera/rig.js');
 const current=new THREE.Vector3(.47,.17,.22),target=new THREE.Vector3(-1,.56,0);
 for(let i=0;i<240;i++){smoothCameraArm(current,target,1-Math.exp(-4/120));assert.ok(Math.hypot(current.x,current.z)>.5);assert.ok(Number.isFinite(current.length()));}
});

test('garage orbit keeps a constant lens distance instead of breathing with the rotating body',()=>{
 const bounds=new THREE.Box3(new THREE.Vector3(-.2,0,-.1),new THREE.Vector3(.2,.15,.1)),frame={x:.65,y:.45,width:.6,height:.65};
 let distance;
 for(let a=0;a<Math.PI*2;a+=.13){const {eye,target}=fitShowroom(bounds,a,.28,1.5,frame),r=eye.distanceTo(target);if(distance)assert.ok(Math.abs(r-distance)<1e-10);distance=r;}
});
