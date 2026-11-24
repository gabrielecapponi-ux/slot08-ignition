// Sample the race camera around every campaign track and count submitted static triangles.
import {register} from 'node:module';
import {performance} from 'node:perf_hooks';
register('./three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {RaceSession}=await import('../src/game/session.js');
const {buildModularTrack}=await import('../src/render/modular-track.js');
const {MiniatureWorld}=await import('../src/render/world.js');
const {localizeScenery,localizeRails}=await import('../src/render/scenery-culling.js');
globalThis.matchMedia=()=>({matches:true});globalThis.window={matchMedia};
globalThis.document={createElement:()=>({getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})})})};
const camera=new THREE.PerspectiveCamera(60,1.9,.02,500),frustum=new THREE.Frustum(),clip=new THREE.Matrix4();
function sweep(root,track){
 root.updateMatrixWorld(true);
 let total=0;
 for(let i=0;i<24;i++){
  const p=track.sample(track.length*i/24);
  camera.position.set(p.x-p.tx,p.z+.75,p.y-p.ty);camera.lookAt(p.x+p.tx,p.z+.12,p.y+p.ty);camera.updateMatrixWorld();
  frustum.setFromProjectionMatrix(clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  root.traverseVisible(m=>{if(m.isMesh&&frustum.intersectsObject(m))total+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);});
 }
 return total;
}
const ms=[];let before=0,after=0,improved=0;
for(let round=0;round<100;round++){
 const race=new RaceSession();race.clubRound=round;race.reset('campaign');race.status='running';
 if(race.cars.length!==8)throw Error('Grid size');
 const t=race.track,root=buildModularTrack(t);root.add(new MiniatureWorld(t,null).root);
 const old=sweep(root,t);localizeScenery(root);localizeRails(root);const current=sweep(root,t);before+=old;after+=current;if(current<old)improved++;
 for(let frame=0;frame<240;frame++){const start=performance.now();race.update(1/120,{throttle:1});race.update(1/120,{throttle:1});ms.push(performance.now()-start);}
}
ms.sort((a,b)=>a-b);
console.log(JSON.stringify({tracks:100,views:2400,improved,triangleReduction:1-after/before,simulationMsP99:ms[Math.floor(ms.length*.99)]}));
