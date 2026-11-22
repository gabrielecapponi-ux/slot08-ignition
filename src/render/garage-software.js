import {vividPaint} from './paint-finish.js';
import * as THREE from 'three';
import { VehicleModels } from './vehicle-models.js';
import { AssetKit } from './asset-kit.js';
import { atelierRoom,installHardware } from './atelier.js';
import { addCarStyle,hiddenStockPart } from './car-style.js';
import { effectiveParts } from '../game/workshop.js';
import { CameraRig } from '../camera/rig.js';
import { rasterizeTriangles } from './software-raster.js';

// Keep one projected vertex per indexed vertex: the showroom and compatibility race
// use the same actual geometry and paint, without a WebGL context.
export class SoftwareGarage {
 constructor(onReady=()=>{}){
  this.camera=new THREE.PerspectiveCamera(42,1,.01,10);
  this.rig=new CameraRig(this.camera,null);this.rig.garage=true;
  this.fleet=new VehicleModels(onReady);
  this.sprites=new WeakMap();
  this.ready=Promise.all([this.fleet.load(0),new AssetKit().load().then(kit=>{
    if(this.disposed)kit.destroy();else {this.kit=kit;onReady();}
  }).catch(()=>null)]);
 }
 mesh(stock,car,cutaway){
  const root=stock.clone(true),look=effectiveParts(car);
  root.traverse(node=>{if(node.isMesh)node.visible=!hiddenStockPart(node.name,look)&&!(cutaway&&/^GT_(roof|glazing)/.test(node.name));});
  addCarStyle(root,car,this.kit);installHardware(root,car,stock.userData.hasSeats);root.updateMatrixWorld(true);
  const vertices=[],faces=[],sun=new THREE.Vector3(.45,.9,.6).normalize();
  const surface=new THREE.Vector3(),edge=new THREE.Vector3();
  const reflection=new THREE.Vector3(.12,.93,.35).normalize(),boxLight=new THREE.Color('#fff4dd');
  root.traverseVisible(m=>{
    if(!m.isMesh)return;
    const g=m.geometry,a=g.attributes.position,index=g.index,base=vertices.length;
    const normals=g.attributes.normal,normalMatrix=new THREE.Matrix3().getNormalMatrix(m.matrixWorld),smoothNormal=new THREE.Vector3(),oneNormal=new THREE.Vector3();
    let color=m.material.color;
    if(m.material.name.startsWith('MAT_lime_enamel'))color=vividPaint(car.color??look.paint);
    if(m.material.name.startsWith('MAT_smoked_glass'))color=new THREE.Color(look.glass);
    if(m.material.name.startsWith('MAT_seat'))color=new THREE.Color(look.seat);
    const opacity=m.material.transparent?m.material.opacity:1;
    for(let i=0;i<a.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld));
    for(let i=0;i<(index?.count??a.count);i+=3){
      const ia=base+(index?index.getX(i):i),ib=base+(index?index.getX(i+1):i+1),ic=base+(index?index.getX(i+2):i+2);
      const normal=surface.subVectors(vertices[ib],vertices[ia]).cross(edge.subVectors(vertices[ic],vertices[ia])).normalize();
      if(normals){smoothNormal.set(0,0,0);for(const vertex of [ia,ib,ic])smoothNormal.add(oneNormal.fromBufferAttribute(normals,vertex-base));normal.copy(smoothNormal).applyMatrix3(normalMatrix).normalize();}
      const diffuse=.4+.88*Math.max(0,normal.dot(sun));
      const gloss=1-(m.material.roughness??1);
      const shine=Math.pow(Math.max(0,normal.dot(reflection)),10+48*gloss)*gloss;
      const shaded=color.clone().multiplyScalar(diffuse).lerp(boxLight,shine*(.18+.40*(m.material.metalness??0)));
      faces.push({ia,ib,ic,opacity,shade:'#'+shaded.getHexString(),depth:0});
    }
  });
  root.traverse(o=>{if(o.userData.ownGeometry)o.geometry.dispose();if(o.userData.ownMaterial)o.material.dispose();});
  return {bounds:new THREE.Box3().setFromPoints(vertices),vertices,faces,screen:vertices.map(()=>new THREE.Vector3())};
 }
 project(mesh,ctx,cullBack){
  const visible=[];
  for(const face of mesh.faces){
    const a=mesh.screen[face.ia],b=mesh.screen[face.ib],c=mesh.screen[face.ic];
    if(a.z>1||b.z>1||c.z>1||a.z< -1||b.z< -1||c.z< -1)continue;
    if(cullBack&&(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0)continue;
    face.depth=a.z+b.z+c.z;visible.push(face);
  }
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const f of visible)for(const i of [f.ia,f.ib,f.ic]){const p=mesh.screen[i];left=Math.min(left,p.x);top=Math.min(top,p.y);right=Math.max(right,p.x);bottom=Math.max(bottom,p.y);}
  left=Math.max(0,Math.floor(left));top=Math.max(0,Math.floor(top));right=Math.min(ctx.canvas.width,Math.ceil(right));bottom=Math.min(ctx.canvas.height,Math.ceil(bottom));
  if(right>left&&bottom>top){const image=ctx.getImageData(left,top,right-left,bottom-top);rasterizeTriangles(image,mesh.screen,visible,left,top);ctx.putImageData(image,left,top);}
  ctx.globalAlpha=1;
 }
 // Bake static workshop positions, flat normals and materials once. A low-detail
 // ring is sufficient for the spanners and tyres in the compatibility renderer.
 workshopBackdrop(){
  const source=atelierRoom(),vertices=[],faces=[];
  const ring=new THREE.TorusGeometry(.39,.11,4,8);
  const transform=new THREE.Matrix4(),sun=new THREE.Vector3(-.4,1,.48).normalize();
  const seen=new Set();
  for(const item of source.children){
   const geometry=item.geometry.type==='TorusGeometry'?ring:item.geometry;
   const attr=geometry.attributes.position,index=geometry.index,mat=item.material;
   const edge=new THREE.Vector3(),normal=new THREE.Vector3();
   for(let n=0;n<item.count;n++){
    item.getMatrixAt(n,transform);const offset=vertices.length;
    // Broad enclosure triangles span the camera and defeat centroid sorting.
    // Draw the room shell, wainscot, glazing and perforated board before fittings.
    const finish=item.name.split(' ')[2],scale=new THREE.Vector3().setFromMatrixScale(transform);
    const layer=finish==='floor'?0:finish==='wall'||(finish==='dark'&&scale.y>1)?1:
      scale.x>=2.9&&finish==='enamel'?2:finish==='perforated'||finish==='pane'?3:4;
    for(let i=0;i<attr.count;i++)vertices.push(new THREE.Vector4(...new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(transform).toArray(),1));
    for(let j=0;j<index.count;j+=3){
     const a=offset+index.getX(j),b=offset+index.getX(j+1),c=offset+index.getX(j+2);
     normal.subVectors(vertices[b],vertices[a]).cross(edge.subVectors(vertices[c],vertices[a])).normalize();
     const tint=mat.color.clone().multiplyScalar(.54+.63*Math.max(0,normal.dot(sun))).add(mat.emissive);
     faces.push({a,b,c,shade:'#'+tint.getHexString(),depth:0,layer});
    }
   }
   item.dispose();seen.add(item.geometry);seen.add(mat);if(mat.map)seen.add(mat.map);
  }
  seen.add(ring);seen.forEach(resource=>resource.dispose());
  return {vertices,projected:vertices.map(()=>new THREE.Vector4()),faces,visible:[]};
 }
 drawWorkshop(ctx,vp,w,h){
  const room=this.room??=this.workshopBackdrop(),points=room.projected,visible=room.visible;
  visible.length=0;
  room.vertices.forEach((vertex,i)=>points[i].copy(vertex).applyMatrix4(vp));
  for(const f of room.faces){
   const a=points[f.a],b=points[f.b],c=points[f.c];
   if(Math.max(a.w,b.w,c.w)<=.012)continue;
   if((a.x< -a.w&&b.x< -b.w&&c.x< -c.w)||(a.x>a.w&&b.x>b.w&&c.x>c.w)||
      (a.y< -a.w&&b.y< -b.w&&c.y< -c.w)||(a.y>a.w&&b.y>b.w&&c.y>c.w))continue;
   f.depth=(a.w+b.w+c.w)/3;visible.push(f);
  }
  visible.sort((a,b)=>a.layer-b.layer||b.depth-a.depth);
  for(const face of visible){
   let polygon=[points[face.a],points[face.b],points[face.c]];
   if(polygon.some(v=>v.w<=.012)){
    const clipped=[];
    for(let i=0;i<3;i++){
     const p=polygon[i],q=polygon[(i+1)%3];
     if(p.w>.012)clipped.push(p);
     if((p.w>.012)!==(q.w>.012))clipped.push(p.clone().lerp(q,(.012-p.w)/(q.w-p.w)));
    }
    polygon=clipped;
   }
   const [a,b,c]=polygon;
   if((b.x/b.w-a.x/a.w)*(c.y/c.w-a.y/a.w)-(b.y/b.w-a.y/a.w)*(c.x/c.w-a.x/a.w)<=0)continue;
   ctx.fillStyle=face.shade;ctx.beginPath();
   polygon.forEach((v,i)=>{const x=(1+v.x/v.w)*w/2,y=(1-v.y/v.w)*h/2;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
   ctx.closePath();ctx.fill();
  }
 }
 raceSprite(car){
  const stock=this.fleet.forChassis(car.chassis);if(!stock)return;
  const cached=this.sprites.get(car);
  // RaceSession replaces cars on configuration or purchase. Cache with that lifetime.
  if(cached?.stock===stock&&cached.kit===this.kit)return cached.canvas;
  const mesh=this.mesh(stock,car,false),canvas=document.createElement('canvas');
  canvas.width=240;canvas.height=160;
  const ctx=canvas.getContext('2d'),scale=500;
  mesh.vertices.forEach((v,i)=>mesh.screen[i].set(canvas.width*.5+v.x*scale,canvas.height*.5+(v.z-.26*v.y)*scale,-v.y-.26*v.z));
  this.project(mesh,ctx,true);this.sprites.set(car,{stock,kit:this.kit,canvas});return canvas;
 }
 draw(ctx,w,h,car){
  const stock=this.fleet.forChassis(car.chassis);if(!stock)return false;
  const cutaway=this.rig.detail==='glass';
  const key=JSON.stringify([stock.uuid,!!this.kit,car,cutaway]);
  if(key!==this.key){this.key=key;this.model=this.mesh(stock,car,cutaway);this.last=0;}
  const now=performance.now();if(now-(this.last||0)<50)return true;
  const dt=Math.min(.06,(now-(this.last||now))/1000);this.last=now;
  this.rig.garageBounds=this.model.bounds;this.camera.aspect=w/h;this.rig.update(null,dt);this.camera.updateMatrixWorld();
  const vp=new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);
  this.model.vertices.forEach((v,i)=>{
    const screen=this.model.screen[i];screen.copy(v);screen.y+=.23;screen.applyMatrix4(vp);
    screen.x=(1+screen.x)*w/2;screen.y=(1-screen.y)*h/2;
  });
  ctx.setTransform(1,0,0,1,0,0);
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#303e48');bg.addColorStop(.48,'#46525a');bg.addColorStop(1,'#131e29');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  this.drawWorkshop(ctx,vp,w,h);
  this.project(this.model,ctx,true);return true;
 }
 destroy(){this.disposed=true;this.fleet.destroy();this.kit?.destroy();}
}
