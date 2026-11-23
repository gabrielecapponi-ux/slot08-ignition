import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Only cars on the starting grid or inspected in the garage need to be downloaded.
const models=[
  new URL('../../assets/fleet-0.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-1.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-2.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-3.glb?v=21.0.0',import.meta.url).href,
  new URL('../../assets/fleet-4.glb?v=21.0.0',import.meta.url).href,
  new URL('../../assets/fleet-5.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-6.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-7.glb?v=15.0.0',import.meta.url).href,
  new URL('../../assets/fleet-8.glb?v=21.0.0',import.meta.url).href,
];
const backup=new URL('../../assets/race-gt.glb',import.meta.url).href;

function disposeTemplate(root) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(node=>{
    if(!node.isMesh)return;
    geometries.add(node.geometry);
    for(const material of [].concat(node.material))materials.add(material);
  });
  for(const material of materials) {
    for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    material.dispose();
  }
  for(const geo of geometries)geo.dispose();
  for(const texture of textures)texture.dispose();
}

export class VehicleModels {
  constructor(onReady=()=>{}) {
    this.onReady=onReady;
    this.templates=new Map();
    this.requests=new Map();
    this.loader=new GLTFLoader();
  }
  async read(url) {
    const asset=await this.loader.loadAsync(url);
    const root=asset.scene.getObjectByName('CAR_GT');
    if(!root){disposeTemplate(asset.scene);throw new Error('Carrozzeria mancante');}
    root.traverse(node=>{if(node.isMesh&&node.material.name.startsWith('MAT_seat'))root.userData.hasSeats=true;});
    root.removeFromParent();root.position.set(0,0,0);root.rotation.set(0,0,0);root.updateMatrixWorld(true);
    disposeTemplate(asset.scene);
    return root;
  }
  load(id=0) {
    if(!Number.isInteger(id)||!models[id])id=0;
    if(!this.requests.has(id)) {
      const task=this.read(models[id]).catch(error=>{
        if(id===0)return this.read(backup);
        console.warn('Auto non disponibile',id,error);
        return null;
      }).then(root=>{
        if(root){
          if(this.disposed)disposeTemplate(root);
          else{this.templates.set(id,root);this.onReady();}
        }
        return this.templates.get(id);
      }).catch(error=>{console.warn('Modello GT non disponibile',error);return null;});
      this.requests.set(id,task);
    }
    return this.requests.get(id);
  }
  forChassis(id=0) {
    if(!this.disposed)this.load(id);
    return this.templates.get(id)??this.templates.get(0);
  }
  destroy() {
    this.disposed=true;
    for(const root of this.templates.values())disposeTemplate(root);
    this.templates.clear();
  }
}
