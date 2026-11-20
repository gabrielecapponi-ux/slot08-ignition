import * as THREE from 'three';
import { THEMES } from '../track/themes.js';
export { THEMES };
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export { skyTexture } from './atmosphere.js';
import { createLandscape } from '../track/landscape.js';
export class MiniatureWorld {
 constructor(track,kit){this.track=track;this.root=new THREE.Group();this.animated=[];this.time=0;this.theme=THEMES[track.theme]??THEMES.forest;this.kit=kit;this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const b=track.bounds,random=seeded(808+track.index*113),width=b.maxX-b.minX,depth=b.maxY-b.minY;
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.95});
  const tray=new THREE.Mesh(new THREE.BoxGeometry(width+6,.38,depth+6),material(this.theme.floor));tray.position.set((b.maxX+b.minX)/2,-.24,(b.maxY+b.minY)/2);tray.receiveShadow=true;this.root.add(tray);
  const field=createLandscape(track);
  const geometry=new THREE.PlaneGeometry(width+5.6,depth+5.6,Math.ceil((width+5.6)/.45),Math.ceil((depth+5.6)/.45));geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position,colors=[],baseColor=new THREE.Color(this.theme.ground),hillColor=new THREE.Color(this.theme.hill),cx=(b.maxX+b.minX)/2,cy=(b.maxY+b.minY)/2;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)+cx,y=pos.getZ(i)+cy,h=field.height(x,y);pos.setXYZ(i,x,h-.016,y);const c=baseColor.clone().lerp(hillColor,Math.min(.7,h*.35+Math.abs(Math.sin(x*4.9+y*3.1))*.12));colors.push(c.r,c.g,c.b);}
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;this.root.add(terrain);
  const points=field.samples,distance=field.distance;
  const groups=new Map();const add=(name,p)=>{const key=name.startsWith('ANIM_')?name:'PROP_'+name;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);};
  // Clusters keep buildings and trees clear of both decks of every crossing.
  const occupied=[];let made=0;
  for(let attempt=0;attempt<2200&&made<Math.min(180,65+track.length*.55);attempt++){
   const x=b.minX-1.5+random()*(width+3),y=b.minY-1.5+random()*(depth+3),d=distance(x,y);if(d<1.15||d>7)continue;
   const type=this.theme.props[Math.floor(random()*this.theme.props.length)],scale=type==='mesa'?1.1+random()*1.5:type==='boulder'?.65+random()*1.1:.75+random()*.7;
   const size=(kit?.footprint('PROP_'+type)??.7)*scale;
   if(d<size+.6||occupied.some(p=>Math.hypot(p.x-x,p.y-y)<p.size+size+.12))continue;
   occupied.push({x,y,size});
   add(type==='bird'?'ANIM_bird':type,{x,y,z:field.height(x,y),scale,angle:random()*Math.PI*2});made++;
  }
  // A perimeter of sculpted low-poly hills gives each track a horizon, even in drone view.
  const hills=[];for(let i=0;i<30;i++){const angle=i/30*Math.PI*2,x=(b.minX+b.maxX)/2+Math.cos(angle)*(width/2+3.5),y=(b.minY+b.maxY)/2+Math.sin(angle)*(depth/2+3.5);hills.push({x,y,scale:1.2+random()*1.8});}
  const hillMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),material(this.theme.hill),hills.length),o=new THREE.Object3D();hills.forEach((p,i)=>{o.position.set(p.x,.3,p.y);o.scale.set(p.scale*1.5,p.scale*.7,p.scale);o.rotation.set(0,random()*6,0);o.updateMatrix();hillMesh.setMatrixAt(i,o.matrix);});hillMesh.castShadow=true;hillMesh.receiveShadow=true;this.root.add(hillMesh);
  // Coastal worlds sit above a continuous water surface, with islands beyond the tray.
  if(['harbor','coast'].includes(track.theme)){
   const water=new THREE.Mesh(new THREE.PlaneGeometry(width+45,depth+45),new THREE.MeshStandardMaterial({color:this.theme.water,roughness:.3,metalness:.25}));water.rotation.x=-Math.PI/2;water.position.set(cx,-.42,cy);water.receiveShadow=true;this.root.add(water);
   if(kit)for(let i=0;i<3;i++)add('sailboat',{x:b.maxX+5+i*2.5,y:cy-3+i*3,z:-.4,angle:i*.7,scale:1.3});
  }
  // Deliberate roadside details: trees, wildlife and lamps are kept clear of every road deck.
  for(let s=2;s<track.length;s+=3.8){const p=track.sample(s),side=s%7<3.5?-1:1,x=p.x+p.nx*side*1.2,y=p.y+p.ny*side*1.2;
   if(distance(x,y)<1.05||occupied.some(q=>Math.hypot(q.x-x,q.y-y)<q.size+.25))continue;
   const type=['night','harbor'].includes(track.theme)?'streetlamp':track.theme==='forest'?(s%8<4?'fern':'mushroom'):track.theme==='alpine'?'boulder':track.theme==='desert'?'tortoise':'flower';
   add(type,{x,y,z:field.height(x,y),angle:-Math.atan2(p.ty,p.tx),scale:.65});
  }
  // Portals are editable Blender models; the curved roof is swept along the same slot path.
  for(const tunnel of track.tunnels){for(const s of [tunnel.start,tunnel.end]){const p=track.sample(s);add('tunnel_portal',{x:p.x,y:p.y,z:p.z+.075,angle:-Math.atan2(p.ty,p.tx)});}}
  if(kit){for(const [name,list]of groups)kit.instance(name,list,this.root);
   const wind=groups.get('PROP_windmill')??[];for(const p of wind.slice(0,4)){const rotor=kit.clone('ANIM_rotor');rotor.position.set(p.x-Math.sin(p.angle)*.19*p.scale,p.scale*1.45,p.y-Math.cos(p.angle)*.19*p.scale);rotor.rotation.order='YXZ';rotor.rotation.y=p.angle;rotor.scale.setScalar(p.scale);this.root.add(rotor);this.animated.push({root:rotor,type:'rotor'});}
   const near=points[Math.floor(points.length*.16)],species=track.theme==='alpine'?'ibex':track.theme==='canyon'||track.theme==='forest'?'fox':'deer';
   for(let i=0;i<3;i++){const animal=kit.clone('PROP_'+species),x=near.x+near.nx*(1.25+i*.55),y=near.y+near.ny*(1.25+i*.55);if(distance(x,y)<.9)continue;animal.position.set(x,field.height(x,y),y);animal.rotation.y=-Math.atan2(near.ty,near.tx);this.root.add(animal);this.animated.push({root:animal,type:'animal',x,y,z:field.height(x,y),phase:i*2});}
   for(let i=0;i<3;i++){const bird=kit.clone('ANIM_bird');bird.scale.setScalar(1.7);this.root.add(bird);this.animated.push({root:bird,type:'bird',x:near.x,y:near.y,phase:i*2.1});}
  }
  this.roofs=new THREE.Group();this.root.add(this.roofs);this.roofMat=new THREE.MeshStandardMaterial({color:track.theme==='night'?'#364968':this.theme.hill,roughness:.78,side:THREE.DoubleSide,transparent:true,opacity:1});
  const lamps=[];
  for(const tunnel of track.tunnels){const v=[],indices=[],n=Math.ceil((tunnel.end-tunnel.start)/.18),steps=16;
   for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n);for(let j=0;j<=steps;j++){const a=j/steps*Math.PI,d=Math.cos(a)*.65;v.push(p.x+p.nx*d,p.z+.59+Math.sin(a)*.65,p.y+p.ny*d);if(i<n&&j<steps){const k=i*(steps+1)+j;indices.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}}if(i%8===0)lamps.push(p);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();const roof=new THREE.Mesh(g,this.roofMat);roof.castShadow=true;roof.receiveShadow=true;this.roofs.add(roof);
   const shellV=[],shellI=[];for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n),radius=.72+.35*Math.sin(Math.PI*i/n);for(let j=0;j<=steps;j++){const a=j/steps*Math.PI,d=Math.cos(a)*radius;shellV.push(p.x+p.nx*d,p.z+.59+Math.sin(a)*radius,p.y+p.ny*d);if(i<n&&j<steps){const k=i*(steps+1)+j;shellI.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}}}
   const shellGeo=new THREE.BufferGeometry();shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(shellV,3));shellGeo.setIndex(shellI);shellGeo.computeVertexNormals();const shell=new THREE.Mesh(shellGeo,this.roofMat);shell.castShadow=true;shell.receiveShadow=true;this.roofs.add(shell);
   for(const side of [-1,1]){const sideV=[];for(let i=0;i<=n;i++){const p=track.sample(tunnel.start+(tunnel.end-tunnel.start)*i/n);for(const z of [.07,.59])sideV.push(p.x+p.nx*side*.65,p.z+z,p.y+p.ny*side*.65);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(sideV,3));const idx=[];for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}g.setIndex(idx);g.computeVertexNormals();this.root.add(new THREE.Mesh(g,this.roofMat));}
  }
  const light=new THREE.InstancedMesh(new THREE.BoxGeometry(.065,.012,.38),new THREE.MeshStandardMaterial({color:'#d7ffff',emissive:'#8be1e7',emissiveIntensity:1.5}),lamps.length);lamps.forEach((p,i)=>{o.position.set(p.x,p.z+1.16,p.y);o.scale.set(1,1,1);o.rotation.set(0,-Math.atan2(p.ty,p.tx),0);o.updateMatrix();light.setMatrixAt(i,o.matrix);});this.root.add(light);
 }
 update(dt,mode,active){if(active&&!this.reduced.matches)this.time+=dt;const t=this.time;this.roofMat.opacity=['top','iso'].includes(mode)?.24:1;this.roofMat.depthWrite=this.roofMat.opacity===1;
  for(const a of this.animated){if(a.type==='rotor')a.root.rotation.z=t*.65;else if(a.type==='animal'){a.root.position.set(a.x+Math.sin(t*.7+a.phase)*.13,(a.z??0)+Math.abs(Math.sin(t*2+a.phase))*.012,a.y);}else{const r=1.4+a.phase*.22;a.root.position.set(a.x+Math.cos(t*.22+a.phase)*r,2.5+Math.sin(t+a.phase)*.15,a.y+Math.sin(t*.22+a.phase)*r);a.root.rotation.set(0,-t*.22-a.phase+Math.PI/2,.12*Math.sin(t*3+a.phase));}}
 }
}
