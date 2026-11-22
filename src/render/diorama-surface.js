let tiles;
const surfaces=['moss','sand','stone','quay','oak','pine','palm','limestone'];
export const groundSwatch=theme=>({forest:'moss',alpine:'stone',coast:'sand',desert:'sand',canyon:'stone',night:'quay',harbor:'quay'}[theme]??'moss');

export function dioramaTiles(){
  if(tiles)return tiles;
  if(typeof Image==='undefined')return Promise.resolve(null);
  tiles=new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{
      const edge=image.naturalWidth/4,maps={};
      for(let i=0;i<surfaces.length;i++){
        const canvas=document.createElement('canvas');canvas.width=canvas.height=edge;
        canvas.getContext('2d').drawImage(image,(i%4)*edge,Math.floor(i/4)*edge,edge,edge,0,0,edge,edge);
        maps[surfaces[i]]=canvas;
      }
      resolve(maps);
    };
    image.onerror=()=>resolve(null);
    image.src=new URL('../../assets/diorama-surface.webp',import.meta.url).href;
  });
  return tiles;
}

let materialAtlas;
const materialTiles=new Map();
const substrates=['moss','sand','stone','quay','ballast'];

// Extract only the two materials needed by the current scene. All three maps
// share UVs and crop boundaries, so individual grains catch light at their edges.
export async function tracksideMaterial(name){
  if(typeof Image==='undefined')return null;
  if(!materialAtlas){
    materialAtlas=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
      image.src=new URL('../../assets/trackside-pbr.webp',import.meta.url).href;
    });
  }
  const atlas=await materialAtlas,column=substrates.indexOf(name);
  if(!atlas||column<0)return null;
  if(!materialTiles.has(name)){
    const edge=atlas.naturalWidth/substrates.length;
    const layers=['color','normal','roughness'].map((channel,row)=>{
      const tile=document.createElement('canvas');tile.width=tile.height=edge;
      tile.getContext('2d').drawImage(atlas,column*edge,row*edge,edge,edge,0,0,edge,edge);
      return [channel,tile];
    });
    materialTiles.set(name,Object.fromEntries(layers));
  }
  return materialTiles.get(name);
}
