import * as THREE from 'three';
import {effectiveParts} from '../game/workshop.js';
import {installHardware} from './atelier.js';
import {installedGroup,mechanicalView} from './installation.js';
import {rasterizeTriangles} from './software-raster.js';

const stockNames={
  wing:/^GT_(rear_wing|wing)/,hood:/^GT_bonnet/,lights:/^GT_(headlight|LED)/,
  wheels:/^GT_(tyre|alloy|wheel_spoke)/,exhaust:/^GT_tailpipe/,aero:/^GT_(splitter|side_skirt|diffuser)/
};

// Inspect the very same geometry used by the race renderer. A depth-tested
// still costs nothing during the race and needs no second WebGL context.
export function benchView(canvas,renderer,car,key){
  const studio=renderer.studio??renderer, group=new THREE.Group();
  let source, select=()=>true;
  if(mechanicalView(key)){
    installHardware(group,car,true);source=group;select=n=>installedGroup(n)===key;
  }else{
    const variant=effectiveParts(car)[key];
    source=variant?studio.kit?.items.get('PART_'+key+'_'+variant):studio.fleet?.forChassis(car.chassis);
    if(!variant)select=n=>stockNames[key]?.test(n.name);
    else if(key==='wheels'&&source?.children.length===4)source=source.children[0];
  }
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const pts=[],faces=[],v=new THREE.Vector3(),edge=new THREE.Vector3(),sun=new THREE.Vector3(.3,.8,.54).normalize();
  const transform=new THREE.Matrix4().makeRotationY(-.55).premultiply(new THREE.Matrix4().makeRotationX(.36));
  source?.updateWorldMatrix(true,true);
  source?.traverse(node=>{
    if(!node.isMesh||!select(node))return;
    const geo=node.geometry,a=geo.attributes.position,idx=geo.index,offset=pts.length;
    for(let i=0;i<a.count;i++)pts.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(node.matrixWorld).applyMatrix4(transform));
    for(let i=0;i<(idx?.count??a.count);i+=3){
      const ia=offset+(idx?idx.getX(i):i),ib=offset+(idx?idx.getX(i+1):i+1),ic=offset+(idx?idx.getX(i+2):i+2);
      const normal=v.subVectors(pts[ib],pts[ia]).cross(edge.subVectors(pts[ic],pts[ia])).normalize();
      const c=node.material.color.clone().multiplyScalar(.58+.72*Math.max(0,normal.dot(sun)));
      c.lerp(new THREE.Color(0xffefe0),Math.pow(Math.max(0,normal.dot(sun)),15)*.35);
      faces.push({ia,ib,ic,opacity:1,shade:'#'+c.getHexString()});
    }
  });
  group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});
  if(!pts.length){ctx.fillStyle='#e5e7e0';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Configurazione di serie',w/2,h/2);return;}
  const box=new THREE.Box3().setFromPoints(pts),size=box.getSize(v),scale=Math.min(w*.88/(size.x||1),h*.81/(size.y||1)),center=box.getCenter(new THREE.Vector3());
  for(const p of pts){p.x=(p.x-center.x)*scale+w/2;p.y=(center.y-p.y)*scale+h/2;p.z=-p.z;}
  const image=ctx.createImageData(w,h);rasterizeTriangles(image,pts,faces);ctx.putImageData(image,0,0);
}
