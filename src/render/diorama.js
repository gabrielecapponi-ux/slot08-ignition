import * as THREE from 'three';
import {tracksideMaterial,groundSwatch} from './diorama-surface.js';

const scenery = {
  forest: ['signal_lodge','fallen_oak','limestone','alpine_fence','fallen_oak'],
  alpine: ['signal_lodge','limestone','alpine_fence','limestone','fallen_oak'],
  coast: ['signal_lodge','limestone','alpine_fence','limestone'],
  harbor: ['dock_jib','freight_stack','pit_bench','freight_stack'],
  night: ['pit_bench','freight_stack','dock_jib','pit_bench'],
  canyon: ['red_bluff','red_bluff','alpine_fence','red_bluff'],
  desert: ['red_bluff','fallen_oak','red_bluff','red_bluff'],
};

// Stage landmarks in distinct sectors, then scatter small plants along their verges.
// The nearest road can be on another loop, so the complete field must be checked.
export function dressCircuit(track, field, kit, occupied, add, random) {
  if (!kit) return;
  const landmarks=scenery[track.theme]??scenery.forest;
  const b=track.bounds;
  const place=(name,at,side,offset,scale,turn)=>{
    if (!kit.items.has('PROP_'+name)) return false;
    const p=track.sample(at), x=p.x+side*p.nx*offset, y=p.y+side*p.ny*offset;
    const size=kit.footprint('PROP_'+name)*scale;
    if(x-size<b.minX-2.7||x+size>b.maxX+2.7||y-size<b.minY-2.7||y+size>b.maxY+2.7)return false;
    if(field.distance(x,y)<.67+size+(track.extraWidth??0)||occupied.some(v=>Math.hypot(x-v.x,y-v.y)<size+v.size+.05))return false;
    // Flat foundations; reject steep terrain under the cabin or a stack of containers.
    const z=field.height(x,y);
    if(['signal_lodge','freight_stack','dock_jib','pit_bench'].includes(name) &&
      [field.height(x-size,y),field.height(x+size,y),field.height(x,y-size),field.height(x,y+size)].some(h=>Math.abs(h-z)>.095))return false;
    occupied.push({x,y,size});
    add(name,{x,y,z:z-.006,angle:-Math.atan2(p.ty,p.tx)+turn,scale});return true;
  };
  for(let i=0;i<10;i++){
    const name=landmarks[i%landmarks.length],scale=.95+random()*.4;
    for(let j=0;j<20;j++){
      const at=(i+.2+random()*.65)*track.length/10;
      if(place(name,at,j%2?1:-1,1.45+random()*1.6,scale,j%2?0:Math.PI))break;
    }
  }
  if(['night','harbor'].includes(track.theme))return;
  const grass=['desert','canyon','coast'].includes(track.theme)?'dune_grass':'meadow_tuft';
  for(let i=0;i<80;i++){
    const at=random()*track.length,side=random()>.5?1:-1,offset=.85+random()*1.65;
    for(let j=0;j<3;j++)place(grass,at+random()*.42,side,offset+random()*.28,.62+random()*.55,random()*Math.PI*2);
  }
}

// The same fine-grained relief supplies pigment and grazing-light response.
export function groundTexture(width,depth,urban){
  const edge=128,data=new Uint8Array(edge*edge*4);
  let seed=37617;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<edge;y++)for(let x=0;x<edge;x++){
    const a=x*2*Math.PI/edge,b=y*2*Math.PI/edge;
    const grain=noise(),variation=7*Math.sin(3*a+2*Math.cos(b))+5*Math.cos(2*b-a)+4*Math.sin(5*a+4*b);
    const value=Math.min(255,Math.max(0,220+(grain-.5)*(urban?22:44)+variation+(grain>.97?18:0)));
    data.set([value,value,value,255],(y*edge+x)*4);
  }
  const map=new THREE.DataTexture(data,edge,edge,THREE.RGBAFormat);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(width/1.6,depth/1.6);
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

// Three irregular bands form a continuous ridgeline beyond the back of the diorama.
// Leave the near edge open to low camera angles and port views open to the sea.
export function ridgeBackdrop(track,theme){
  if(['harbor','coast','night'].includes(track.theme))return null;
  const b=track.bounds,span=b.maxX-b.minX+12;
  const positions=[],colors=[],indices=[],count=64;
  const tint=new THREE.Color(theme.hill),crest=new THREE.Color(theme.sky);
  const amp={alpine:3.1,forest:1.45,desert:1.15,canyon:2.4}[track.theme]??1.3;
  for(let i=0;i<=count;i++){
    const t=i/count,phase=track.index*.45;
    const elevation=amp*(.4+.39*Math.sin(t*17+phase)**2+.22*Math.cos(t*35-phase)+.11*Math.sin(t*83));
    const height=Math.max(.24,elevation)*Math.min(1,.1+Math.min(t,1-t)*12);
    for(let j=0;j<3;j++){
      const x=b.minX-6+t*span;
      positions.push(x,[-.44,height*.44,height][j],b.minY-3.2-[0,.65+Math.sin(t*25)*.16,1.7+Math.sin(t*8)*.4][j]);
      const c=tint.clone().lerp(crest,j*.14+(Math.sin(t*29+j)*.04+.04)); colors.push(c.r,c.g,c.b);
      if(i<count&&j<2){const k=i*3+j;indices.push(k,k+3,k+1,k+1,k+3,k+4);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const ridge=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));
  ridge.receiveShadow=true;return ridge;
}

export function harborWater(track,theme){
  const b=track.bounds,width=b.maxX-b.minX+45,depth=b.maxY-b.minY+45;
  const edge=128,data=new Uint8Array(edge*edge*4);
  for(let y=0;y<edge;y++)for(let x=0;x<edge;x++){
    const a=2*Math.PI*x/edge,b=2*Math.PI*y/edge;
    const ridges=Math.sin(a*2+b*7+.8*Math.sin(2*a-b))+.44*Math.sin(a*5+b*11+.6*Math.cos(a+b));
    const value=205+Math.round(27*ridges);
    data.set([value,value,value,255],(y*edge+x)*4);
  }
  const ripple=new THREE.DataTexture(data,edge,edge,THREE.RGBAFormat);
  ripple.wrapS=ripple.wrapT=THREE.RepeatWrapping;ripple.repeat.set(width/1.7,depth/1.7);
  ripple.magFilter=THREE.LinearFilter;ripple.minFilter=THREE.LinearMipmapLinearFilter;
  ripple.generateMipmaps=true;ripple.needsUpdate=true;
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshPhysicalMaterial({
    color:theme.water,map:ripple,bumpMap:ripple,bumpScale:.006,roughness:.15,metalness:0,ior:1.333,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:1.1,
  }));
  surface.userData.ownTexture=true;surface.rotation.x=-Math.PI/2;
  surface.position.set((b.minX+b.maxX)/2,-.42,(b.minY+b.maxY)/2);
  surface.receiveShadow=true;return surface;
}

// Bake broad contact shading into the existing terrain grid. Each footprint touches
// only nearby vertices, keeping the mobile frame cost independent of prop count.
export function finishTerrain(mesh,occupied,theme){
  const g=mesh.geometry,positions=g.attributes.position,colors=g.attributes.color;
  const density=new Float32Array(positions.count),cols=g.parameters.widthSegments+1;
  const originX=positions.getX(0),originZ=positions.getZ(0);
  const stepX=positions.getX(1)-originX,stepZ=positions.getZ(cols)-originZ;
  for(const p of occupied){
    if(p.size<.27)continue;
    const radius=Math.max(.42,p.size*1.4);
    const col=Math.round((p.x-originX)/stepX),row=Math.round((p.y-originZ)/stepZ);
    const reachX=Math.ceil(radius/Math.abs(stepX)),reachZ=Math.ceil(radius/Math.abs(stepZ));
    for(let z=Math.max(0,row-reachZ);z<=Math.min(g.parameters.heightSegments,row+reachZ);z++){
      for(let x=Math.max(0,col-reachX);x<=Math.min(cols-1,col+reachX);x++){
        const i=z*cols+x,r=((positions.getX(i)-p.x)**2+(positions.getZ(i)-p.y)**2)/(radius*radius);
        density[i]=Math.max(density[i],Math.max(0,1-r)**1.6*.40);
      }
    }
  }
  for(let i=0;i<positions.count;i++){
    const a=1-density[i];colors.setXYZ(i,colors.getX(i)*a,colors.getY(i)*a,colors.getZ(i)*a);
  }
  colors.needsUpdate=true;
  const repeat=mesh.material.map.repeat.clone().multiplyScalar(.77);
  applySubstrate(mesh,groundSwatch(theme),repeat,theme==='forest'?.75:.60,()=>{
    const tint=new THREE.Color(({alpine:'#e1eae1',canyon:'#f3bf9e',night:'#a3b6c5',harbor:'#c9d7d8'}[theme])??'#ffffff');
    const second=new THREE.Color(({forest:'#e4cfa8',canyon:'#d99677',coast:'#f4ddb3',alpine:'#c5d2ce'}[theme])??'#e0d8c5');
    const mix=new THREE.Color();
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i);
      const broad=.5+.28*Math.sin(x*.61+Math.cos(z*.27))+.22*Math.cos(z*.84-x*.26);
      mix.copy(tint).lerp(second,broad*.54);
      const a=(.84+.16*broad)*(1-density[i]);colors.setXYZ(i,mix.r*a,mix.g*a,mix.b*a);
    }
    colors.needsUpdate=true;
  });
}

function applySubstrate(mesh,swatch,repeat,normalStrength,onReady){
  const material=mesh.material;
  let disposed=false;
  const close=()=>{disposed=true;};
  material.addEventListener('dispose',close);
  tracksideMaterial(swatch).then(layers=>{
    material.removeEventListener('dispose',close);
    if(!layers||disposed)return;
    const make=(image,color)=>{
      const map=new THREE.CanvasTexture(image);
      map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.copy(repeat);map.anisotropy=material.userData.anisotropy??4;
      if(color)map.colorSpace=THREE.SRGBColorSpace;
      return map;
    };
    const previous=material.map;
    material.map=make(layers.color,true);
    material.normalMap=make(layers.normal,false);
    material.roughnessMap=make(layers.roughness,false);
    material.bumpMap=null;material.normalScale.setScalar(normalStrength);material.roughness=1;
    material.addEventListener('dispose',()=>{
      material.normalMap.dispose();material.roughnessMap.dispose();
    });
    material.needsUpdate=true;previous?.dispose();onReady?.();
  });
}

// Broad gravel collects outside bends. The apron narrows along the straights
// and tapers before a bridge, instead of following its suspended road deck.
export function trackVerge(track){
  const group=new THREE.Group();
  const industrial=['night','harbor'].includes(track.theme);
  const rock=['canyon','desert'].includes(track.theme);
  const color=new THREE.Color(industrial?'#bcc5c2':rock?'#e9ba90':track.theme==='alpine'?'#d3d9d3':'#dccdb5');
  const positions=[],uv=[],colors=[],indices=[],placements=[];
  const sections=Math.ceil(track.length/.14),rows=4;
  let seed=8211+track.index;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const side of [-1,1]){
    const start=positions.length/3;
    for(let i=0;i<=sections;i++){
      const at=i*track.length/sections,p=track.sample(at);
      const phase=at/track.length*Math.PI*2,curvature=p.curvature??0;
      const fade=1-THREE.MathUtils.smoothstep(p.z,.045,.23);
      const corner=Math.min(1,Math.max(0,-curvature*side)*2.9);
      const variation=Math.sin(phase*11+side)*.034+Math.cos(phase*23-side)*.021;
      const width=industrial?.27+.20*corner:.18+corner*.48+variation;
      const edge=.383+(track.extraWidth??0)+(p.fork?.offset||0)/2;
      const bands=[0,.20,.76,1];
      for(let j=0;j<rows;j++){
        const offset=(edge+width*bands[j])*side,x=p.x+p.nx*offset,z=p.y+p.ny*offset;
        const elevation=[.016,.020,.002,-.004][j];
        positions.push(x,elevation,z);uv.push(x/1.12,-z/1.12);
        const tint=[.68,1,.91,.77][j],alpha=fade*[1,1,.92,0][j];
        colors.push(color.r*tint,color.g*tint,color.b*tint,alpha);
        if(i<sections&&j<3&&fade>0){
          const k=start+i*rows+j;
          if(side===1)indices.push(k,k+1,k+rows,k+1,k+rows+1,k+rows);
          else indices.push(k,k+rows,k+1,k+1,k+rows,k+rows+1);
        }
      }
      if(!industrial&&i<sections&&fade>.9&&random()<.2+corner*.50){
        const r=.010+.012*random(),d=edge+r+(width-r*2)*(.15+random()*.67);
        placements.push({x:p.x+p.nx*d*side,z:p.y+p.ny*d*side,r,angle:random()*6.28,tint:random()});
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.setIndex(indices);g.computeVertexNormals();
  const apron=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#a89980',vertexColors:true,roughness:.92,transparent:true,depthWrite:false}));
  apron.name='Trackside apron';apron.userData.ownTexture=true;apron.receiveShadow=true;group.add(apron);
  applySubstrate(apron,industrial?'quay':'ballast',new THREE.Vector2(1,1),.82,()=>apron.material.color.set('#ffffff'));
  if(placements.length){
    const stones=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({roughness:.74}),placements.length);
    const pose=new THREE.Object3D(),ink=new THREE.Color(),dark=new THREE.Color(rock?'#826445':'#777568'),light=new THREE.Color(rock?'#d6a77d':'#c5beaa');
    placements.forEach((p,i)=>{
      pose.position.set(p.x,.014,p.z);pose.rotation.set(p.angle*.37,p.angle,0);pose.scale.set(p.r*1.4,p.r*.64,p.r);
      pose.updateMatrix();stones.setMatrixAt(i,pose.matrix);stones.setColorAt(i,ink.copy(dark).lerp(light,p.tint));
    });
    stones.name='Shoulder gravel';stones.receiveShadow=true;group.add(stones);
  }
  return group;
}
