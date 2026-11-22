import * as THREE from 'three';

// The back wall and pit equipment sit outside the racing envelope in every camera.
export function clubRoom(track) {
  const root=new THREE.Group(), b=track.bounds;
  const width=b.maxX-b.minX+9, depth=b.maxY-b.minY+10;
  const x=(b.minX+b.maxX)/2, z=(b.minY+b.maxY)/2;
  const unit=new THREE.BoxGeometry(1,1,1);
  function material(color,roughness=.65){return new THREE.MeshStandardMaterial({color,roughness});}
  function box(cx,cy,cz,w,h,d,mat){
    const mesh=new THREE.Mesh(unit,mat);mesh.position.set(cx,cy,cz);
    mesh.scale.set(w,h,d);mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  const wood=material(0x9d6949),steel=material(0x303b48),wall=material(0x53606c);
  const stripe=material(0xe6a03d),lamp=new THREE.MeshBasicMaterial({color:0xfff1cf});
  box(x,-.21,z,width,.35,depth,wood);
  const back=b.minY-4.8;
  const beam=material(0x48403a,.48),brass=material(0x987044,.31);brass.metalness=.66;
  const timber=material(0x9a7955);
  const warmGlass=new THREE.MeshStandardMaterial({color:0xffdfb5,emissive:0xffcc87,emissiveIntensity:1.25,roughness:.25});
  const frameMaterial=material(0x584a3c,.53);
  box(x,1.6,back,width+3,4,.16,wall);
  box(x,1.05,back+.10,width+3,.11,.06,stripe);
  for(const offset of [-.31,0,.31]){
    const px=x+width*offset;
    box(px,2.95,back+.17,width*.17,.09,.18,lamp);
    box(px,.66,back+.7,2.65,.11,.85,wood);
    for(const side of [-1,1])box(px+side*1.03,.33,back+.7,.12,.65,.62,steel);
    box(px+.7,.87,back+.7,.43,.30,.35,stripe);
  }
  // Windows stay behind the entire board. Their varying panes remain readable in the close track cameras.
  for(const side of [-1,1]){
    const center=x+side*width*.34,windowW=width*.24;
    box(center,2.12,back+.12,windowW,1.35,.045,frameMaterial);
    const panes=4;
    for(let i=0;i<panes;i++){
      const wx=center+(i-(panes-1)/2)*(windowW/panes);
      box(wx,2.12,back+.15,windowW/panes-.065,1.23,.035,warmGlass);
      box(wx,2.21,back+.19,windowW/panes,.036,.035,timber);
    }
    box(center,1.43,back+.17,windowW+.14,.07,.19,timber);
  }
  // Suspended enamel workshop lights, with a single warm practical lighting the benches.
  const shades=new THREE.InstancedMesh(new THREE.ConeGeometry(.38,.23,24,1,true),brass,5);
  const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.098,12,8),warmGlass,5);
  const cords=new THREE.InstancedMesh(new THREE.CylinderGeometry(.013,.013,.48,6),beam,5);
  const pose=new THREE.Object3D();
  for(let i=0;i<5;i++){
    const cx=x+(i-2)*width*.196,cz=back+1.45;
    for(const [mesh,cy] of [[cords,3.9],[shades,3.56],[bulbs,3.44]]){
      pose.position.set(cx,cy,cz);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);
    }
  }
  root.add(shades,bulbs,cords);
  const practical=new THREE.PointLight(0xffbe76,18,11,2);
  practical.position.set(x,3.40,back+1.45);root.add(practical);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#101a22';ctx.fillRect(0,0,1024,192);
  ctx.fillStyle='#ffbd57';ctx.font='bold 46px sans-serif';ctx.fillText('SLOT 08    /    CLUB RACING',36,70);
  ctx.fillStyle='#f2f0e9';ctx.font='bold 64px sans-serif';ctx.fillText(track.meeting.name.toUpperCase(),36,155,950);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.4,1.2),new THREE.MeshBasicMaterial({map}));
  sign.position.set(x,1.95,back+.10);sign.userData.ownTexture=true;root.add(sign);return root;
}
