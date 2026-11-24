// One photographic environment is requested when its circuit is selected.
export function biomePhoto(theme){
 const file={forest:'forest',alpine:'ice',orion:'moon',solar:'space'}[theme];
 return file?new URL('../../assets/biomes/'+file+'.webp',import.meta.url).href:null;
}
