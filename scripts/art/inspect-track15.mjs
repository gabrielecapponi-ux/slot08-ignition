// Export the actual runtime meshes for offline Blender geometry inspection.
// This is a QA render, not a screenshot of the WebGL game.
import {register} from 'node:module';
import {writeFile} from 'node:fs/promises';
register('../three-test-loader.mjs',import.meta.url);
const THREE=await import('three');
const {createTrack}=await import('../../src/track/catalog.js');
const {buildModularTrack}=await import('../../src/render/modular-track.js');
const {MEETINGS}=await import('../../src/game/tour.js');
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const variant=Number(process.argv[2]||0),track=createTrack(MEETINGS[variant].level,{lanes:4,variant}),root=buildModularTrack(track);
root.updateMatrixWorld(true);
const materials=[],geometries=[],objects=[],seenMaterials=new Map(),seenGeo=new Map();
root.traverse(o=>{
 if(!o.isMesh)return;
 if(!seenMaterials.has(o.material.uuid)){
  const m=o.material,map=m.map?.image;
  seenMaterials.set(m.uuid,materials.length);materials.push({name:m.name||o.name,color:m.color.toArray(),metal:m.metalness||0,rough:m.roughness??.5,clearcoat:m.clearcoat||0,emission:m.emissive?.toArray(),energy:m.emissiveIntensity||0,map:map?.data?{width:map.width,height:map.height,pixels:Array.from(map.data)}:null});
 }
 if(!seenGeo.has(o.geometry.uuid)){
  const g=o.geometry;seenGeo.set(g.uuid,geometries.length);geometries.push({position:Array.from(g.attributes.position.array),index:g.index?Array.from(g.index.array):null,uv:g.attributes.uv?Array.from(g.attributes.uv.array):null});
 }
 const record=matrix=>objects.push({name:o.name,geo:seenGeo.get(o.geometry.uuid),material:seenMaterials.get(o.material.uuid),matrix:matrix.toArray()});
 if(o.isInstancedMesh){const m=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);record(m.premultiply(o.matrixWorld));}}else record(o.matrixWorld);
});
await writeFile(process.argv[3]||'/tmp/slot15-track.json',JSON.stringify({materials,geometries,objects,track:{length:track.length,bounds:track.bounds,pose:track.pose(2,1)}}));
console.log(JSON.stringify({meshes:objects.length,materials:materials.length,geometries:geometries.length}));
