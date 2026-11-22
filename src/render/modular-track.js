import { buildSafetyRail, trackPoint } from './safety-rail.js';
import { createLandscape } from '../track/landscape.js';
import { courseDetails } from './course-details.js';
import * as THREE from 'three';
import { PHYSICS } from '../core/config.js';

/** Longer circuits reuse the Blender GT while building their modular toy road
 * from the exact simulation path. Geometry is constructed only on track change. */
export function buildModularTrack(track,kit=null) {
  const e=track.extraWidth??0,lanes=track.lanes.map(l=>track.laneOffset(l));
  const root = new THREE.Group(), n = Math.ceil(track.length / .09);
  const position=(p,d,h)=>{d+=Math.sign(d)*(p.fork?.offset||0)/2;return [p.x+p.nx*d*Math.cos(p.bank||0),p.z-d*Math.sin(p.bank||0)+h,p.y+p.ny*d*Math.cos(p.bank||0)];};
  const orient=(object,p)=>{object.rotation.order='YZX';object.rotation.set(p.bank||0,-Math.atan2(p.ty,p.tx),Math.atan(p.grade||0));};
  const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness ? .32 : .83, side: THREE.DoubleSide });
  const asphalt = new THREE.MeshPhysicalMaterial({color:'#292e35',metalness:.06,roughness:.40,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide}), rail = mat('#b8c1c3', .85), slot = mat('#090e14'), white = mat('#f4e8cf');
  // The grain spans the full width of the track so the polished tyre paths follow each lane.
  const size=256,pixels=new Uint8Array(size*size*4),finish=new Uint8Array(pixels.length);
  let seed=804;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<size;y++){
    const phase=y/size*2*Math.PI;
    const weave=.004*Math.sin(phase)+.002*Math.sin(phase*3+.4);
    for(let x=0;x<size;x++){
      const across=(x/(size-1)-.5)*track.width;
      const wheel=Math.min(...lanes.map(d=>Math.abs(Math.abs(across-weave-d)-.069)));
      const tread=Math.exp(-((wheel/.025)**2)),dust=1-tread;
      const pit=random(),grit=random(),striations=.5+.5*Math.cos(wheel*1600+Math.sin(phase*2));
      const tow=((Math.floor(x/4)+Math.floor(y/4))%4<2?1:-1)*(8+7*Math.sin((x+y)*Math.PI/4));
      const shade=197+tow+grit*20+dust*8-tread*(52+24*striations)-(pit<.028?24:0);
      const gloss=199+grit*37-tread*(97+20*striations);
      const i=4*(x+y*size);
      pixels[i]=shade;pixels[i+1]=shade;pixels[i+2]=shade+dust*2;pixels[i+3]=255;
      // Three.js reads roughness from green and bump from red.
      finish[i]=pit<.028?24:130+(grit-.5)*110*dust;
      finish[i+1]=gloss;finish[i+2]=0;finish[i+3]=255;
    }
  }
  function treadTexture(data){
    const texture=new THREE.DataTexture(data,size,size);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.anisotropy=2;texture.needsUpdate=true;return texture;
  }
  asphalt.map=treadTexture(pixels);asphalt.map.colorSpace=THREE.SRGBColorSpace;const roughness=treadTexture(finish);
  asphalt.roughnessMap=asphalt.bumpMap=roughness;asphalt.bumpScale=.0003;asphalt.clearcoatRoughnessMap=roughness;
  asphalt.addEventListener('dispose',()=>roughness.dispose());
  asphalt.color.set('#697078');asphalt.roughness=.48;asphalt.envMapIntensity=1.25;asphalt.name="Carbonio twill sotto trasparente";
  const conductorMat=new THREE.MeshPhysicalMaterial({color:'#e1e5e6',metalness:1,roughness:.24,anisotropy:.55,anisotropyRotation:Math.PI/2,side:THREE.DoubleSide,vertexColors:true});
  conductorMat.envMapIntensity=1.35;
  // Longitudinal brushed scratches: mipmapped roughness, never flashing geometry.
  const brushData=new Uint8Array(128*128*4);
  for(let x=0;x<128;x++){
    const groove=.5+.26*Math.sin(x*1.71)+.16*Math.sin(x*.51);
    for(let y=0;y<128;y++){const v=Math.round(160+groove*60+8*Math.sin(y*.09+x*.13));brushData.set([v,v,v,255],4*(x+y*128));}
  }
  const brush=new THREE.DataTexture(brushData,128,128);brush.wrapS=brush.wrapT=THREE.RepeatWrapping;brush.generateMipmaps=true;brush.minFilter=THREE.LinearMipmapLinearFilter;brush.needsUpdate=true;
  conductorMat.roughnessMap=brush;conductorMat.addEventListener('dispose',()=>brush.dispose());
  const sampled=s=>track.sample(s);
  function conductor(center,sample=sampled,start=0,length=track.length,steps=n,base=.077){
    const vertices=[],indices=[],colors=[],uv=[];
    // A slightly crowned conductor with a bevel on both shoulders catches grazing light.
    const section=[[-.0062,0],[-.0057,.0023],[-.0039,.0037],[0,.0042],[.0039,.0037],[.0057,.0023],[.0062,0]];
    for(let i=0;i<=steps;i++){
      const p=sample(start+i/steps*length);
      for(const [offset,h] of section){
        vertices.push(...position(p,center+offset,base+h));uv.push((offset+.0062)/.0124,(start+i/steps*length)*2);
        // The contact braid polishes the crown. The recessed shoulders retain tarnish.
        const exposed=Math.exp(-((offset/.0049)**4));
        const tone=.42+exposed*.56;
        colors.push(tone*(1.015-exposed*.015),tone,tone*(.93+exposed*.07));
      }
      if(i<steps)for(let j=0;j<section.length-1;j++){
        const a=i*section.length+j,b=a+section.length;indices.push(a,a+1,b,b,a+1,b+1);
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,conductorMat);mesh.name='Conduttore in alpacca';mesh.receiveShadow=true;root.add(mesh);
  }
  function ribbon(left, right, height, material, sample = sampled, start = 0, length = track.length, steps = n) {
    if(track.fork&&left<0&&right>0&&sampled===sample){ribbon(left,-.0001,height,material,sample,start,length,steps);ribbon(.0001,right,height,material,sample,start,length,steps);return;}
    const vertices = [], indices = [];
    for (let i = 0; i <= steps; i++) {
      const p = sample(start + i / steps * length);
      for (const d of [left,right]) vertices.push(...position(p,d,height));
      if (i < steps) { const a = i * 2; indices.push(a,a+1,a+2,a+1,a+3,a+2); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    if(material===asphalt){
      const uv=[];
      for(let i=0;i<=steps;i++){
        const s=start+i/steps*length;
        // Rear tyres leave a wider line on the outside of bends; sample over one car length.
        const k=(sample(s-.14).curvature+2*sample(s).curvature+sample(s+.14).curvature)/4;
        const drift=.041*Math.tanh(2.4*k)/track.width;
        const v=i/steps*Math.max(1,Math.round(length/1.48));
        uv.push(left/track.width+.5+drift,v,right/track.width+.5+drift,v);
      }
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    }
    const mesh = new THREE.Mesh(geometry,material);if(material===asphalt)mesh.userData.ownTexture=true; mesh.receiveShadow = true;mesh.castShadow=material===asphalt;root.add(mesh);
  }
  ribbon(-.48-e,.48+e,.028,mat('#777773'));
  ribbon(-.38-e,.38+e,.058,slot); ribbon(-.35-e,.35+e,.075,asphalt);
  for (const lane of lanes) {
    ribbon(lane-.016,lane+.016,.077,slot);
    for (const side of [-1,1]) conductor(lane+side*.026);
  }
  const curves = [];
  for (let s = 0; s < track.length; s += .22) if (Math.abs(track.sample(s).curvature) > .05) curves.push(s);
  const curbSection=new THREE.Shape();
  curbSection.moveTo(-.104,-.020);curbSection.lineTo(.104,-.020);curbSection.lineTo(.104,.015);
  curbSection.lineTo(-.104,.015);curbSection.closePath();
  const box=new THREE.ExtrudeGeometry(curbSection,{depth:.055,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:2,steps:1});
  box.translate(0,0,-.0275);
  const transform = new THREE.Object3D();
  const paintChip=new Uint8Array(64*64*4);
  for(let i=0;i<paintChip.length;i+=4){
    const r=random(),v=r>.984?113+18*random():221+32*random();
    paintChip.set([v,v,v,255],i);
  }
  const fleck=new THREE.DataTexture(paintChip,64,64);fleck.wrapS=fleck.wrapT=THREE.RepeatWrapping;
  fleck.generateMipmaps=true;fleck.minFilter=THREE.LinearMipmapLinearFilter;fleck.magFilter=THREE.LinearFilter;fleck.needsUpdate=true;fleck.repeat.set(5,5);
  const curbRed=mat('#c84430'),curbIvory=mat('#f0dabc');curbRed.map=curbIvory.map=fleck;curbRed.roughness=.62;curbIvory.roughness=.64;
  for (let phase=0; phase<2; phase++) {
    const cells=curves.filter((_,i)=>i%2===phase), mesh=new THREE.InstancedMesh(box,phase?curbIvory:curbRed,cells.length*2);let j=0;
    for(const s of cells){
      const p=track.sample(s);
      for(const side of [-1,1]){
        transform.position.set(...position(p,side*(.36+e),.093));orient(transform,p);transform.updateMatrix();
        mesh.setMatrixAt(j,transform.matrix);
        const worn=.80+random()*.20;mesh.setColorAt(j++,new THREE.Color(worn,worn*.99,worn*.96));
      }
    }
    mesh.name='Cordoli smussati';mesh.userData.ownTexture=phase===0;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  // Mould joins stop at the steel bands. Countersunk heads and slots are batched by finish.
  const seamCount=Math.floor(track.length/1.2);
  const spans=[];let left=-.348-e;for(const lane of lanes){if(track.fork&&left<0&&lane-.036>0){spans.push([left,-.001],[.001,lane-.036]);}else spans.push([left,lane-.036]);left=lane+.036;}spans.push([left,.348+e]);
  const seams=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.001,1),slot,seamCount*spans.length);
  const screwHeads=new THREE.InstancedMesh(new THREE.CylinderGeometry(.013,.015,.003,8),mat('#888b88',.65),seamCount*2);
  const screwSlots=new THREE.InstancedMesh(new THREE.BoxGeometry(.017,.001,.003),slot,seamCount*2);
  for(let i=0;i<seamCount;i++){
    const p=track.sample((i+.5)*track.length/seamCount);orient(transform,p);
    spans.forEach(([start,end],j)=>{
      transform.position.set(...position(p,(start+end)/2,.076));transform.scale.set(1,1,end-start);
      transform.updateMatrix();seams.setMatrixAt(i*spans.length+j,transform.matrix);
    });
    transform.scale.setScalar(1);
    for(let j=0;j<2;j++){
      const side=j?1:-1,fastener=track.sample((i+.5)*track.length/seamCount+.044*side);
      orient(transform,fastener);transform.position.set(...position(fastener,side*(.452+e),.031));transform.updateMatrix();
      screwHeads.setMatrixAt(i*2+j,transform.matrix);
      transform.position.y+=.002;transform.rotateY(i*.73+j);transform.updateMatrix();screwSlots.setMatrixAt(i*2+j,transform.matrix);
    }
  }
  seams.name='Giunti stampati del modulo';screwHeads.name='Viti svasate del piano';root.add(seams,screwHeads,screwSlots);
  for(const gate of track.switches) for(const lane of track.lanes) {
    const target=track.switchTarget(gate,lane);if(target===lane)continue;
    const change={from:lane,to:target,start:gate.start,length:gate.end-gate.start};
    const sample=s=>{const p=track.pose(s,lane,change);return {...p,nx:-p.ty,ny:p.tx};};
    ribbon(-.013,.013,.079,slot,sample,gate.start,change.length,50);
    for(const side of [-1,1])conductor(side*.026,sample,gate.start,change.length,50,.080);
  }
  const p=track.sample(.08), checker=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.003,track.width/8),white,8);
  for(let i=0;i<8;i++){const d=(i-3.5)*track.width/8,along=i%2*.09;transform.position.set(p.x+p.nx*d+p.tx*along,p.z+.082,p.y+p.ny*d+p.ty*along);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);transform.updateMatrix();checker.setMatrixAt(i,transform.matrix);}root.add(checker);
  root.add(buildSafetyRail(track));
  // Opaque deck fascias are separate from the rail, with physical thickness.
  for(const side of [-1,1]){
   const v=[],idx=[];for(let i=0;i<=n;i++){const p=track.sample(i/n*track.length);for(const h of [.018,.058])v.push(...position(p,side*(.38+e),h));if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,slot);m.castShadow=true;m.receiveShadow=true;root.add(m);
  }
  const field=createLandscape(track),roadPoints=field.samples,supports=[];
  for(let s=0;s<track.length;s+=1.6){
   const p=track.sample(s);if(p.z<=.25)continue;
   for(const side of [-1,1]){
    const top=trackPoint(p,side*(.46+e),.012),ground=field.height(top.x,top.z),height=top.y-ground;
    // A pier must not occupy the swept footprint of another, lower road deck.
    const blocked=roadPoints.some(q=>q.z<p.z-.35&&Math.abs((top.x-q.x)*q.nx+(top.z-q.y)*q.ny)<.50+e+(q.fork?.offset||0)/2&&Math.abs((top.x-q.x)*q.tx+(top.z-q.y)*q.ty)<.25);
    if(!blocked&&height>.20)supports.push({p,side,top,ground,height});
   }
  }
  const supportsMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.043,.055,1,12),mat('#969c96',.25),supports.length);
  supports.forEach(({top,ground,height},i)=>{transform.position.set(top.x,ground+height/2,top.z);transform.scale.set(1,height,1);transform.rotation.set(0,0,0);transform.updateMatrix();supportsMesh.setMatrixAt(i,transform.matrix);});supportsMesh.name='Pilastri con appoggio a terra';supportsMesh.castShadow=true;supportsMesh.receiveShadow=true;root.add(supportsMesh);
  if(supports.length){
    const shoes=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.030,.18),mat('#777c77'),supports.length);
    const seats=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.024,.11),mat('#535c60',.48),supports.length);
    const bolts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.009,.008,6),rail,supports.length*4);
    supports.forEach(({p,top,ground},i)=>{
      transform.scale.setScalar(1);transform.rotation.set(0,-Math.atan2(p.ty,p.tx),0);
      transform.position.set(top.x,ground+.007,top.z);transform.updateMatrix();shoes.setMatrixAt(i,transform.matrix);
      for(let j=0;j<4;j++){
        const dx=(j&1?.066:-.066),dz=(j&2?.066:-.066);
        transform.position.set(top.x+p.tx*dx+p.nx*dz,ground+.026,top.z+p.ty*dx+p.ny*dz);
        transform.updateMatrix();bolts.setMatrixAt(4*i+j,transform.matrix);
      }
      orient(transform,p);transform.position.copy(top);transform.updateMatrix();seats.setMatrixAt(i,transform.matrix);
    });
    shoes.name='Piastre di fondazione';seats.name='Mensole del viadotto';
    for(const detail of [shoes,seats,bolts]){detail.castShadow=true;detail.receiveShadow=true;root.add(detail);}
  }
  root.userData.piers=supports.map(({top,ground})=>({top:top.toArray(),ground}));
  // A readable start gantry and illuminated edge markers give every circuit its own identity.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=768;labelCanvas.height=160;
  const ctx=labelCanvas.getContext('2d');ctx.fillStyle=track.theme==='night'?'#162f44':'#183c34';ctx.fillRect(0,0,768,160);ctx.fillStyle='#d9f1a5';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('SLOT 08 / WORLDS',384,46);ctx.fillStyle='#ffffff';ctx.font='bold 37px sans-serif';ctx.fillText(track.level.name.toUpperCase(),384,110,710);
  const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const gate=track.sample(.08),angle=-Math.atan2(gate.ty,gate.tx),sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5+2*e,.31),new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.25,side:THREE.DoubleSide,roughness:.7}));sign.position.set(gate.x,gate.z+1.36,gate.y);sign.rotation.y=angle-Math.PI/2;sign.userData.ownTexture=true;root.add(sign);
  if (!e && kit?.items.has('PROP_mobile_gantry')) {
    kit.instance('PROP_mobile_gantry', [{x:gate.x,y:gate.y,z:gate.z,angle:angle-Math.PI/2}], root);
  } else {
  const gatePosts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.035,1.4,8),rail,2);[-1,1].forEach((side,i)=>{transform.position.set(gate.x+gate.nx*side*(.75+e),gate.z+.7,gate.y+gate.ny*side*(.75+e));transform.scale.set(1,1,1);transform.rotation.set(0,0,0);transform.updateMatrix();gatePosts.setMatrixAt(i,transform.matrix);});root.add(gatePosts);
  }
  const lamps=[];for(let s=7;s<track.length;s+=7){const p=track.sample(s);if(!track.tunnelAt?.(s,1))lamps.push(p);}
  const glow=new THREE.MeshStandardMaterial({color:track.theme==='night'?'#95fff0':'#ffe8b4',emissive:track.theme==='night'?'#58dccb':'#ffcc7d',emissiveIntensity:track.theme==='night'?2:.4});
  const lampsMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.045,.35,.045),glow,lamps.length*2);let lamp=0;for(const p of lamps)for(const side of[-1,1]){transform.position.set(...position(p,side*(.47+e),.203));transform.rotation.set(0,0,0);transform.updateMatrix();lampsMesh.setMatrixAt(lamp++,transform.matrix);}root.add(lampsMesh);
  root.userData.startLights=[];
  for(let i=0;i<5;i++){
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.036,12,8),new THREE.MeshStandardMaterial({color:'#3c1612',emissive:'#ff3b17',emissiveIntensity:0,roughness:.28}));
    const d=(i-2)*.14;bulb.position.set(gate.x+gate.nx*d,gate.z+1.09,gate.y+gate.ny*d);root.add(bulb);root.userData.startLights.push(bulb.material);
  }
  root.add(courseDetails(track));
  return root;
}
