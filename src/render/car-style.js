import {sidewallPrint} from './sidewall.js';
import {pinVertices,pinTriangles} from './hood-fastener.js';
import * as THREE from 'three';
import { effectiveParts } from '../game/workshop.js';
export function addCarStyle(root,car,kit){
 const look=effectiveParts(car);
 // Body and glass already have private paint materials at this point.
 // Soften the clear varnish under the overhead strips and let the seat and
 // roll cage render through both sides of the window in close-up.
 root.traverse(node=>{
   if(!node.isMesh || !node.userData.ownMaterial)return;
   const material=node.material;
   if(material.isMeshPhysicalMaterial && material.name.startsWith('MAT_lime_enamel')){
     material.clearcoatRoughness=.07;
     material.envMapIntensity=1.34;material.metalness=.29;material.roughness=.20;material.clearcoat=1;
   }else if(material.name.startsWith('MAT_smoked_glass')){
     material.depthWrite=false;
     if(material.isMeshPhysicalMaterial)material.clearcoatRoughness=.075;
   }
 });


 // Cast each edge onto the selected body: the deck and canopy heights differ
 // between a touring car and a prototype. Stripes follow those surfaces.
 root.updateMatrixWorld(true);
 const panels=[];
 root.traverse(o=>{if(o.isMesh&&o.visible&&o.material.name.startsWith('MAT_lime_enamel'))panels.push(o);});
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,-1,0);
 const surface=(x,z,guess)=>{
   ray.set(new THREE.Vector3(x,.30,z),direction);
   return (ray.intersectObjects(panels,false)[0]?.point.y??guess)+.00065;
 };
 for(const key of ['wing','wheels','hood','aero','lights','exhaust']){
   if(!look[key]||!kit)continue;
   const part=kit.clone('PART_'+key+'_'+look[key]);
   if(key==='hood'&&panels.length){
     const box=new THREE.Box3().setFromObject(part);
     if(!box.isEmpty())part.position.y=surface(.075,0,.070)-box.min.y+.001;
   }
   root.add(part);
 }
 if(!look.wheels)sidewallPrint(root,true);
 // Cast fasteners onto each chassis and align them with the actual bonnet slope.
 if(panels.length){
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pinVertices,3));geo.setIndex(pinTriangles);geo.computeVertexNormals();
   const steel=new THREE.MeshStandardMaterial({color:'#c9d2cd',metalness:.9,roughness:.24});
   for(const side of [-1,1]){
     const x=.084,z=side*.047,y=surface(x,z,.07),pin=new THREE.Mesh(geo,steel);
     pin.name='Chiusura cofano a quarto di giro';pin.position.set(x,y,z);
     pin.rotation.z=Math.atan2(surface(x+.002,z,y)-surface(x-.002,z,y),.004);
     pin.userData.ownMaterial=true;pin.userData.ownGeometry=true;root.add(pin);
   }
 }

 const mainColor=look.decal===7?'#18242c':look.decal===3?'#f4eee1':'#f4e5ca';
 const add=(x,z,width,length,color,lift=0)=>{
   const steps=Math.max(2,Math.ceil(length/.008)),verts=[],indices=[];
   for(let i=0;i<=steps;i++){
     const px=x-length/2+length*i/steps;
     for(const side of [-1,1]){
       const pz=z+side*width/2;
       verts.push(px,surface(px,pz,x>.02?.073:.132)+lift,pz);
     }
     if(i<steps){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
   geometry.setIndex(indices);geometry.computeVertexNormals();
   const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:color??mainColor,roughness:.38,metalness:.15}));
   mesh.userData.ownGeometry=true;mesh.userData.ownMaterial=true;root.add(mesh);
 };
 // One projected number panel, including the ink, in a single draw call.
 if(panels.length){
   const vertices=[],colors=[];
   const patch=(x,z,length,width,ink,lift)=>{
     const tint=new THREE.Color(ink);
     for(const [u,v] of [[0,0],[1,0],[0,1],[1,0],[1,1],[0,1]]){
       const px=x+u*length,pz=z+v*width;
       vertices.push(px,surface(px,pz,.071)+lift,pz);colors.push(tint.r,tint.g,tint.b);
     }
   };
   patch(.063,.023,.036,.028,'#eeeae1',.0008);
   patch(.063,.023,.006,.028,'#e35331',.0014);
   const digits=['111101101101111','111101111101111'];
   digits.forEach((glyph,col)=>[...glyph].forEach((pixel,i)=>{
     if(pixel==='1')patch(.073+(4-Math.floor(i/3))*.0044,.026+col*.012+(i%3)*.0033,.0045,.0034,'#12212c',.0018);
   }));
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
   const panel=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,side:THREE.DoubleSide}));
   panel.userData.ownGeometry=panel.userData.ownMaterial=true;root.add(panel);
 }
 if(!look.decal)return;
 if(look.decal>=8){
   const accent=['#a6b1b9','#ed277d','#77d4cd'][look.decal-8];
   for(const x of [-.015,.092]){
     add(x,-.014,.022,.057,accent);add(x,.004,.004,.057,'#25292d');
   }
   for(const side of [-1,1])for(let i=0;i<3;i++)add(-.076+i*.007,side*(.051+i*.004),.017,.004,accent);
 }else if(look.decal===1){for(const z of [-.016,.016]){add(.085,z,.009,.083);add(-.008,z,.009,.075);}}
 else if(look.decal===3){for(const [z,color]of [[-.015,'#3b9e75'],[0,'#eee8d6'],[.015,'#e85b4c']]){add(.085,z,.014,.083,color);add(-.008,z,.014,.075,color);}}
 else if(look.decal===4){for(let i=0;i<6;i++)for(let j=0;j<3;j++)if((i+j)%2===0)add(.05+i*.013,(j-1)*.014,.014,.013);}
 else if(look.decal===5){add(.085,0,.058,.08);add(-.008,0,.05,.07);}
 else if(look.decal===6){for(let i=0;i<4;i++)add(.05+i*.019,(i%2?.014:-.014),.012,.024);}
 else{add(.085,0,look.decal===7?.063:.02,.083);add(-.008,0,look.decal===7?.063:.02,.075);}
}
export function hiddenStockPart(name,look){
 if(look.wing&&/GT_(wing|rear_wing)/.test(name))return true;
 if(look.wheels&&/GT_(tyre|alloy|wheel_spoke|brake_caliper)/.test(name))return true;
 if(look.aero&&/GT_(splitter|side_skirt)/.test(name))return true;
 if(look.exhaust&&/^GT_tailpipe/.test(name))return true;
 if(look.lights>=5&&/^GT_auxiliary/.test(name))return true;
 if(look.decal&&/GT_(roof_stripe|hood_race_stripe|roof_number)/.test(name))return true;
 return false;
}
