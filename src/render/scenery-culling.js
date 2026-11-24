import * as THREE from 'three';

// Keep repeated geometry shared, but give expensive stands and kerbs local
// bounds so the renderer can reject whole patches before submitting triangles.
export function localizeScenery(root){
 const batches=[];
 root.traverse(mesh=>{
  if(!mesh.isInstancedMesh||mesh.count<12||mesh.morphTexture||mesh.children.length)return;
  const vertices=mesh.geometry.index?.count??mesh.geometry.attributes.position.count;
  if(vertices*mesh.count>=72000)batches.push(mesh);
 });
 const matrix=new THREE.Matrix4(),color=new THREE.Color();
 for(const source of batches){
  const cells=new Map();
  for(let i=0;i<source.count;i++){
   source.getMatrixAt(i,matrix);
   const key=Math.floor(matrix.elements[12]/12)+','+Math.floor(matrix.elements[14]/12);
   if(!cells.has(key))cells.set(key,[]);
   cells.get(key).push(i);
  }
  if(cells.size<2)continue;
  for(const ids of cells.values()){
   const mesh=new THREE.InstancedMesh(source.geometry,source.material,ids.length);
   mesh.name=source.name;mesh.userData={...source.userData};
   mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;
   mesh.visible=source.visible;mesh.renderOrder=source.renderOrder;mesh.layers.mask=source.layers.mask;
   source.updateMatrix();mesh.matrix.copy(source.matrix);mesh.matrixAutoUpdate=false;
   ids.forEach((id,i)=>{
    source.getMatrixAt(id,matrix);mesh.setMatrixAt(i,matrix);
    if(source.instanceColor){source.getColorAt(id,color);mesh.setColorAt(i,color);}
   });
   mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.15;
   source.parent.add(mesh);
  }
  source.removeFromParent();source.dispose();
 }
}

// The rails cover the whole lap in a single indexed strip. Keep the original
// vertex buffers and split only the index list, with bounds for each section.
export function localizeRails(root){
 const rails=[];
 root.traverse(m=>{if(m.name==='Binario in acciaio spazzolato'&&m.geometry?.index?.count>16000)rails.push(m);});
 const point=new THREE.Vector3();
 for(const rail of rails){
  const original=rail.geometry,pos=original.attributes.position,index=original.index.array;
  const block=6048; // 168 whole seven-vertex rail sections (36 indices per section).
  for(let start=0;start<index.length;start+=block){
   const slice=index.subarray(start,Math.min(start+block,index.length));
   const geometry=new THREE.BufferGeometry();
   for(const [name,attribute] of Object.entries(original.attributes))geometry.setAttribute(name,attribute);
   geometry.setIndex(new THREE.BufferAttribute(slice,1));
   const box=new THREE.Box3();
   for(const i of slice)box.expandByPoint(point.fromBufferAttribute(pos,i));
   geometry.boundingBox=box;geometry.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
   const mesh=new THREE.Mesh(geometry,rail.material);mesh.name=rail.name;
   mesh.receiveShadow=rail.receiveShadow;mesh.castShadow=rail.castShadow;
   mesh.matrixAutoUpdate=false;rail.parent.add(mesh);
  }
  rail.removeFromParent();original.dispose();
 }
}
