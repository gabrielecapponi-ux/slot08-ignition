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
     material.clearcoatRoughness=.13;
     material.envMapIntensity=.78;material.metalness=.18;material.roughness=.27;material.clearcoat=1;
   }else if(material.name.startsWith('MAT_smoked_glass')){
     material.depthWrite=false;
     if(material.isMeshPhysicalMaterial)material.clearcoatRoughness=.075;
   }
 });
 for(const key of ['wing','wheels','hood','aero','lights','exhaust'])if(look[key]&&kit)root.add(kit.clone('PART_'+key+'_'+look[key]));
 if(!look.decal)return;
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
 const mainColor=look.decal===7?'#18242c':look.decal===3?'#f4eee1':'#f4e5ca';
 const add=(x,z,width,length,color)=>{
   const steps=Math.max(2,Math.ceil(length/.008)),verts=[],indices=[];
   for(let i=0;i<=steps;i++){
     const px=x-length/2+length*i/steps;
     for(const side of [-1,1]){
       const pz=z+side*width/2;
       verts.push(px,surface(px,pz,x>.02?.073:.132),pz);
     }
     if(i<steps){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
   geometry.setIndex(indices);geometry.computeVertexNormals();
   const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:color??mainColor,roughness:.38,metalness:.15}));
   mesh.userData.ownGeometry=true;mesh.userData.ownMaterial=true;root.add(mesh);
 };
 if(look.decal===1){for(const z of [-.016,.016]){add(.085,z,.009,.083);add(-.008,z,.009,.075);}}
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
