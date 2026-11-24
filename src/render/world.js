import {apexPanels} from './apex-panels.js';
import {grassVertices,grassIndices} from './verge-mesh.js';
import {plantStand,windMaterial} from './trees.js';
import {portalVertices,portalTriangles} from './portal-mesh.js';
import * as THREE from 'three';
import {landmarkPlacements,levelLandmarkFoundations} from './landmarks.js';
import {trackPoint} from './safety-rail.js';
import { THEMES } from '../track/themes.js';
import { trackVerge, finishTerrain, dressCircuit, groundTexture, harborWater, ridgeBackdrop } from './diorama.js';
export { THEMES };
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export { skyTexture } from './atmosphere.js';
import { createLandscape } from '../track/landscape.js';
export class MiniatureWorld {
 constructor(track,kit){this.track=track;this.root=new THREE.Group();this.animated=[];this.time=0;this.theme=THEMES[track.theme]??THEMES.forest;this.kit=kit;this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const b=track.bounds,random=seeded(808+track.index*113),width=b.maxX-b.minX,depth=b.maxY-b.minY;
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.95});
  const tray=new THREE.Mesh(new THREE.BoxGeometry(width+10,.38,depth+10),material(this.theme.floor));tray.position.set((b.maxX+b.minX)/2,-.24,(b.maxY+b.minY)/2);tray.receiveShadow=true;this.root.add(tray);
  const e=track.extraWidth??0,field=createLandscape(track);
  const geometry=new THREE.PlaneGeometry(width+9.6,depth+9.6,Math.ceil((width+9.6)/.45),Math.ceil((depth+9.6)/.45));geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position,colors=[],baseColor=new THREE.Color(this.theme.ground),hillColor=new THREE.Color(this.theme.hill),cx=(b.maxX+b.minX)/2,cy=(b.maxY+b.minY)/2;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)+cx,y=pos.getZ(i)+cy,h=field.height(x,y);pos.setXYZ(i,x,h-.016,y);const c=baseColor.clone().lerp(hillColor,Math.min(.7,h*.35+Math.abs(Math.sin(x*4.9+y*3.1))*.12));colors.push(c.r,c.g,c.b);}
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const map=groundTexture(width+9.6,depth+9.6,['night','harbor'].includes(track.theme));
  const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,map,bumpMap:map,bumpScale:.006,roughness:.94}));
  terrain.userData.ownTexture=true;terrain.receiveShadow=true;this.root.add(terrain);
  this.wind={value:0};
  const points=field.samples,distance=field.distance;
  const groups=new Map();const add=(name,p)=>{const key=name.startsWith('ANIM_')?name:'PROP_'+name;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);};
  // Clusters keep buildings and trees clear of both decks of every crossing.
  const landmarks=landmarkPlacements(track,field,kit),occupied=[...landmarks];
  levelLandmarkFoundations(terrain,landmarks);
  for(const p of landmarks)add(p.name,p);
  this.root.userData.landmarks=landmarks;
  dressCircuit(track,field,kit,occupied,add,random);let made=0;
  for(let attempt=0;attempt<2200&&made<Math.min(180,65+track.length*.55);attempt++){
   const x=b.minX-1.5+random()*(width+3),y=b.minY-1.5+random()*(depth+3),d=distance(x,y);if(d<1.15||d>7)continue;
   const type=this.theme.props[Math.floor(random()*this.theme.props.length)],scale=type==='mesa'?1.1+random()*1.5:type==='boulder'?.65+random()*1.1:.75+random()*.7;
   const size=(kit?.footprint('PROP_'+type)??.7)*scale;
   if(d<size+.6+e||occupied.some(p=>Math.hypot(p.x-x,p.y-y)<p.size+size+.12))continue;
   occupied.push({x,y,size});
   add(type==='bird'?'ANIM_bird':type,{x,y,z:field.height(x,y),scale,angle:random()*Math.PI*2});made++;
  }
  finishTerrain(terrain,occupied,track.theme);
  this.root.add(trackVerge(track),apexPanels(track));
  if(track.theme==='canyon'){
   // A low basalt caldera outside the racing envelope; UVs project the actual lake onto its bowl.
   const rings=[0,.42,.71,.87,1],heights=[.18,.24,.9,1.62,-.1],v=[],uv=[],ix=[];
   for(let j=0;j<rings.length;j++)for(let i=0;i<=64;i++){
    const a=i*Math.PI/32,r=rings[j],rim=1+.09*Math.sin(a*5)+.07*Math.cos(a*3);
    v.push(Math.cos(a)*r*rim*7,heights[j]*(1+.12*Math.sin(a*4)),Math.sin(a)*r*rim*4.5);
    uv.push(.5+.49*Math.cos(a)*r,.5+.49*Math.sin(a)*r);
    if(i<64&&j<4){const k=j*65+i;ix.push(k,k+1,k+65,k+1,k+66,k+65);}
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   const mat=new THREE.MeshStandardMaterial({roughness:.87,side:THREE.DoubleSide,color:'#d6c5b6'});
   if(typeof Image!=='undefined'){mat.map=new THREE.TextureLoader().load(new URL('../../assets/biomes/caldera.webp',import.meta.url).href);mat.map.colorSpace=THREE.SRGBColorSpace;}
   const cone=new THREE.Mesh(g,mat);cone.userData.ownTexture=true;cone.position.set(cx,0,b.minY-5.8);this.root.add(cone);
  }
  const ridge=track.theme==='orion'?null:ridgeBackdrop(track,this.theme);
  if(ridge)this.root.add(ridge);
  const o=new THREE.Object3D();
  if(['forest','alpine','coast'].includes(track.theme)){
   const sites=[];
   for(let s=0;s<track.length;s+=.24){
    const p=track.sample(s),side=sites.length%2?1:-1,offset=side*(1+e+random()*.95);
    const x=p.x+p.nx*offset,y=p.y+p.ny*offset;
    if(distance(x,y)>.82+e && !occupied.some(q=>Math.hypot(x-q.x,y-q.y)<q.size*.7))
      sites.push({x,y});
   }
   const g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(grassVertices,3));g.setIndex(grassIndices);g.computeVertexNormals();
   const mat=windMaterial(new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),this.wind,.18);
   const turf=new THREE.InstancedMesh(g,mat,sites.length);
   sites.forEach(({x,y},i)=>{o.position.set(x,field.height(x,y)-.014,y);o.rotation.y=random()*6.28;o.scale.setScalar(.65+random()*.6);o.updateMatrix();turf.setMatrixAt(i,o.matrix);turf.setColorAt(i,new THREE.Color().setHSL(.18+random()*.06,.32,.24+random()*.14));});
   turf.receiveShadow=true;this.root.add(turf);
  }
  // Coastal worlds sit above a continuous water surface, with islands beyond the tray.
  if(['harbor','coast'].includes(track.theme)){
   this.water=harborWater(track,this.theme);this.root.add(this.water);
   if(kit)for(let i=0;i<3;i++)add('sailboat',{x:b.maxX+5+i*2.5,y:cy-3+i*3,z:-.4,angle:i*.7,scale:1.3});
  }
  // Deliberate roadside details: trees, wildlife and lamps are kept clear of every road deck.
  for(let s=2;s<track.length;s+=3.8){const p=track.sample(s),side=s%7<3.5?-1:1,x=p.x+p.nx*side*1.2,y=p.y+p.ny*side*1.2;
   if(distance(x,y)<1.05||occupied.some(q=>Math.hypot(q.x-x,q.y-y)<q.size+.25))continue;
   const type=['night','harbor'].includes(track.theme)?'streetlamp':track.theme==='forest'?(s%8<4?'fern':'mushroom'):track.theme==='alpine'?'boulder':track.theme==='desert'?'tortoise':'flower';
   add(type,{x,y,z:field.height(x,y),angle:-Math.atan2(p.ty,p.tx),scale:.65});
  }
  // Outside bends get layered silhouettes, with gaps at crossings and buildings.
  const scenery={
    forest:['pine','oak','fern'],coast:['palm','boulder','flower'],alpine:['pine','boulder','boulder'],
    harbor:['crate','warehouse','streetlamp'],night:['streetlamp','crate','warehouse'],
    desert:['boulder','cactus','boulder']
  }[track.theme]??(track.theme==='orion'?['boulder','boulder','boulder']:['boulder','pine','fern']);
  for(let s=3;s<track.length;s+=8.7){
    const p=track.sample(s);if(Math.abs(p.curvature)<.08)continue;
    const outside=-Math.sign(p.curvature);
    for(let i=0;i<3;i++){
      const d=outside*(2.2+i*.81),x=p.x+p.nx*d+p.tx*i*.47,y=p.y+p.ny*d+p.ty*i*.47;
      if(x<b.minX-1||x>b.maxX+1||y<b.minY-1||y>b.maxY+1||distance(x,y)<1.6||occupied.some(q=>Math.hypot(x-q.x,y-q.y)<q.size+1))continue;
      add(scenery[i],{x,y,z:field.height(x,y),angle:s*.71+i,scale:.65+i*.22});
    }
  }
  // Portals are editable Blender models; the curved roof is swept along the same slot path.
  // Open portal jambs leave the racing line and camera corridor unobstructed.
  for(const species of ['pine','oak','palm']){
   const name='PROP_'+species,list=groups.get(name)??[];
   const detailed=kit?.items?.has(name);
   plantStand(species,detailed?list.filter((_,i)=>i%3===0):list,this.root,track.weather,this.wind);
   groups.set(name,detailed?list.filter((_,i)=>i%3!==0):[]);
  }
  const lunar=track.theme==='orion';
  if(lunar){
   for(const name of ['PROP_fern','PROP_flower','PROP_mushroom','ANIM_bird'])groups.delete(name);
  }
  if(kit){for(const [name,list]of groups)kit.instance(name,list,this.root);
   const wind=groups.get('PROP_windmill')??[];for(const p of wind.slice(0,4)){const rotor=kit.clone('ANIM_rotor');rotor.position.set(p.x-Math.sin(p.angle)*.19*p.scale,p.scale*1.45,p.y-Math.cos(p.angle)*.19*p.scale);rotor.rotation.order='YXZ';rotor.rotation.y=p.angle;rotor.scale.setScalar(p.scale);this.root.add(rotor);this.animated.push({root:rotor,type:'rotor'});}
   const near=points[Math.floor(points.length*.16)],species=track.theme==='alpine'?'ibex':track.theme==='canyon'||track.theme==='forest'?'fox':'deer';
   for(let i=0;!lunar&&i<3;i++){const animal=kit.clone('PROP_'+species),x=near.x+near.nx*(1.25+i*.55),y=near.y+near.ny*(1.25+i*.55);if(distance(x,y)<.9+e)continue;animal.position.set(x,field.height(x,y),y);animal.rotation.y=-Math.atan2(near.ty,near.tx);this.root.add(animal);this.animated.push({root:animal,type:'animal',x,y,z:field.height(x,y),phase:i*2});}
   for(let i=0;!lunar&&i<3;i++){const bird=kit.clone('ANIM_bird');bird.scale.setScalar(1.7);this.root.add(bird);this.animated.push({root:bird,type:'bird',x:near.x,y:near.y,phase:i*2.1});}
  }
  this.roofs=new THREE.Group();this.root.add(this.roofs);this.roofMat=new THREE.MeshStandardMaterial({color:track.theme==='night'?'#364968':this.theme.hill,roughness:.78,side:THREE.DoubleSide});
  const ribs=[];
  for(const t of track.tunnels){
    const count=Math.max(2,Math.ceil((t.end-t.start)/.36));
    for(let i=0;i<=count;i++)ribs.push(track.sample(t.start+(t.end-t.start)*i/count));
  }
  if(ribs.length){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(portalVertices,3));
    geometry.setIndex(portalTriangles);geometry.computeVertexNormals();
    const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:'#b2c6d0',metalness:.8,roughness:.28,side:THREE.DoubleSide}),ribs.length);
    ribs.forEach((p,i)=>{
      o.position.set(p.x,p.z-.017,p.y);o.rotation.set(0,-Math.atan2(p.ny,p.nx),0);
      o.scale.set((.65+e)/.65,1,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new THREE.Color(['#6bdeea','#79bafb','#ffac73'][Math.floor(i/4)%3]));
    });
    this.roofs.add(mesh);
  }
  const lamps=[];
  for(const t of track.tunnels)for(const s of [t.start,t.end]){
    const p=track.sample(s);
    for(const side of [-1,1]){
      const edge=trackPoint(p,side*(.69+e)),base=Math.min(edge.y+.012,field.height(edge.x,edge.z)),top=p.z+.64;
      const post=new THREE.Mesh(new THREE.BoxGeometry(.12,Math.max(.12,top-base),.13),material('#807a70'));post.position.set(edge.x,(base+top)/2,edge.z);post.rotation.y=-Math.atan2(p.ty,p.tx);post.castShadow=true;post.receiveShadow=true;this.root.add(post);
    }
  }
  const marine=['coast','titan'].includes(track.theme);
  let windowMat=this.roofMat;
  if(marine&&track.tunnels.length){
    const panel=document.createElement('canvas');panel.width=512;panel.height=160;
    const ctx=panel.getContext('2d'),water=ctx.createLinearGradient(0,0,0,160);
    water.addColorStop(0,'#53ddd7');water.addColorStop(.45,'#117a92');water.addColorStop(1,'#063147');
    ctx.fillStyle=water;ctx.fillRect(0,0,512,160);
    for(let j=0;j<19;j++){const x=(j*137)%512,y=35+(j*43)%90;
      ctx.fillStyle='#084657';ctx.beginPath();ctx.ellipse(x,y,7,2.1,-.14,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x-12,y-3);ctx.lineTo(x-11,y+4);ctx.fill();}
    ctx.strokeStyle='#a8ffed55';for(let j=0;j<13;j++){ctx.beginPath();ctx.moveTo(j*44,0);ctx.lineTo(j*44-36,77);ctx.stroke();}
    ctx.fillStyle='#233c48';ctx.fillRect(0,0,8,160);ctx.fillRect(0,149,512,11);
    const tex=new THREE.CanvasTexture(panel);tex.wrapS=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
    windowMat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  }
  for(const tunnel of track.tunnels){const v=[],indices=[],n=Math.ceil((tunnel.end-tunnel.start)/.18),steps=16;
   for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n);for(let j=0;j<=steps;j++){const a=j/steps*Math.PI,d=Math.cos(a)*(.65+e);v.push(p.x+p.nx*d,p.z+.59+Math.sin(a)*.65,p.y+p.ny*d);if(i<n&&j<steps){const k=i*(steps+1)+j;indices.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}}if(i%8===0)lamps.push(p);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();const roof=new THREE.Mesh(g,this.roofMat);roof.castShadow=true;roof.receiveShadow=true;this.roofs.add(roof);
   const shellV=[],shellI=[];for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n),radius=.72+e+.35*Math.sin(Math.PI*i/n);for(let j=0;j<=steps;j++){const a=j/steps*Math.PI,d=Math.cos(a)*radius;shellV.push(p.x+p.nx*d,p.z+.59+Math.sin(a)*radius,p.y+p.ny*d);if(i<n&&j<steps){const k=i*(steps+1)+j;shellI.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}}}
   const shellGeo=new THREE.BufferGeometry();shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(shellV,3));shellGeo.setIndex(shellI);shellGeo.computeVertexNormals();const shell=new THREE.Mesh(shellGeo,this.roofMat);shell.castShadow=true;shell.receiveShadow=true;this.roofs.add(shell);
   for(const side of [-1,1]){const sideV=[];for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n);for(const z of [.07,.59])sideV.push(p.x+p.nx*side*(.65+e),p.z+z,p.y+p.ny*side*(.65+e));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(sideV,3));const idx=[];for(let i=0;i<n;i++){if(!marine && i%8>=2 && i%8<=5)continue;const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}g.setIndex(idx);g.computeVertexNormals();if(marine){const uv=[];for(let i=0;i<=n;i++)uv.push(i/15,0,i/15,1);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}this.root.add(new THREE.Mesh(g,windowMat));}
  }
  // Four concentric bands match the editable After Effects diffuser.
  const strip=document.createElement('canvas');strip.width=64;strip.height=384;
  const pen=strip.getContext('2d');
  for(const [w,h,color] of [[64,384,'#183039'],[45,366,'#45969f'],[30,352,'#95dfe5'],[12,344,'#e2fdff']]){
   pen.fillStyle=color;pen.fillRect((64-w)/2,(384-h)/2,w,h);
  }
  const diffuser=new THREE.CanvasTexture(strip);diffuser.colorSpace=THREE.SRGBColorSpace;
  const light=new THREE.InstancedMesh(new THREE.BoxGeometry(.065,.012,.38),new THREE.MeshBasicMaterial({map:diffuser}),lamps.length);lamps.forEach((p,i)=>{o.position.set(p.x,p.z+1.16,p.y);o.scale.set(1,1,1);o.rotation.set(0,-Math.atan2(p.ty,p.tx),0);o.updateMatrix();light.setMatrixAt(i,o.matrix);});light.userData.ownTexture=true;this.root.add(light);
 }
 update(dt,mode,active,inside=false){if(active&&!this.reduced.matches)this.time+=dt;const t=this.time;this.wind.value=t;this.roofs.visible=!['top','iso'].includes(mode) && (!inside || mode==='chase' || mode==='macro');
  if(this.water)this.water.material.map.offset.set(t*.012,t*.006);
  for(const a of this.animated){if(a.type==='rotor')a.root.rotation.z=t*.65;else if(a.type==='animal'){a.root.position.set(a.x+Math.sin(t*.7+a.phase)*.13,(a.z??0)+Math.abs(Math.sin(t*2+a.phase))*.012,a.y);}else{const r=1.4+a.phase*.22;a.root.position.set(a.x+Math.cos(t*.22+a.phase)*r,2.5+Math.sin(t+a.phase)*.15,a.y+Math.sin(t*.22+a.phase)*r);a.root.rotation.set(0,-t*.22-a.phase+Math.PI/2,.12*Math.sin(t*3+a.phase));}}
 }
}
