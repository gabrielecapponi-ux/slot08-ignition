import * as THREE from 'three';

// Pad-printed GT lettering follows the tyre shoulder rather than floating on the rim.
const print=['111011101110','100001001010','101001001110','101001001010','111001001110'];
export function sidewallPrint(root,stock=false){
 root.updateMatrixWorld(true);
 const bounds=Array.from({length:4},()=>new THREE.Box3()),v=new THREE.Vector3();
 root.traverse(n=>{
   if(!n.isMesh||!n.visible||!(/^(MAT_vulcanized_rubber|Graphite tyre compound)$/.test(n.material.name)))return;
   const a=n.geometry.attributes.position;
   for(let i=0;i<a.count;i++){
     v.fromBufferAttribute(a,i).applyMatrix4(n.matrixWorld);
     bounds[2*Number(v.x>0)+Number(v.z>0)].expandByPoint(v);
   }
 });
 const vertices=[],colors=[];
 for(const box of bounds){
   if(box.isEmpty())continue;
   const c=box.getCenter(new THREE.Vector3()),r=(box.max.y-box.min.y)/2,side=Math.sign(c.z);
   const rect=(angle,width,inner,outer,color)=>{
     const pigment=new THREE.Color(color);
     for(const [a,b] of [[0,0],[1,0],[0,1],[1,0],[1,1],[0,1]]){
       const theta=angle+a*width,radius=r*(inner+b*(outer-inner));
       const p=new THREE.Vector3(c.x+side*radius*Math.sin(theta),c.y+radius*Math.cos(theta),(side>0?box.max.z:box.min.z)+side*.00024);
       root.worldToLocal(p);vertices.push(p.x,p.y,p.z);colors.push(pigment.r,pigment.g,pigment.b);
     }
   };
   for(let row=0;row<print.length;row++)for(let col=0;col<print[row].length;col++){
     if(print[row][col]==='1')rect(-.37+col*.058,.059,.93-row*.025,.955-row*.025,'#e9deb7');
   }
   for(const a of [2.74,2.88,3.02])rect(a,.10,.858,.926,'#dd9e3f');
 }
 if(!vertices.length)return;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({name:'GT pad print',vertexColors:true,roughness:.75,side:THREE.DoubleSide}));
 mesh.name='GT_tyre_pad_print';if(stock)mesh.userData.carSurface='wheel';
 mesh.userData.ownGeometry=stock;mesh.userData.ownMaterial=stock;root.add(mesh);
}
