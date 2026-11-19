import * as THREE from 'three';
import { effectiveParts } from '../game/workshop.js';
export function addCarStyle(root,car,kit){
 const look=effectiveParts(car);
 for(const key of ['wing','wheels','hood','aero','lights','exhaust'])if(look[key]&&kit)root.add(kit.clone('PART_'+key+'_'+look[key]));
 if(!look.decal)return;
 const mat=new THREE.MeshStandardMaterial({color:look.decal===7?'#18242c':look.decal===3?'#f4eee1':'#f4e5ca',roughness:.4,metalness:.15});
 const add=(x,z,width,length,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(length,.001,width),color?new THREE.MeshStandardMaterial({color,roughness:.45}):mat);m.position.set(x,x>.02?.073:.132,z);m.userData.ownGeometry=true;m.userData.ownMaterial=true;root.add(m);};
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
 if(look.decal&&/GT_(roof_stripe|hood_race_stripe|roof_number)/.test(name))return true;
 return false;
}
