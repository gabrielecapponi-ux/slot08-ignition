import * as THREE from 'three';

function block(root,name,color,size,position,metalness=.25){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,metalness,roughness:.37}));
 mesh.position.set(...position);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData.ownGeometry=true;mesh.userData.ownMaterial=true;root.add(mesh);return mesh;
}
function mechanicalMesh(root,name,geometry,material,position){
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(...position);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.ownGeometry=true;mesh.userData.ownMaterial=true;
 root.add(mesh);return mesh;
}

export function installHardware(root,car,hasSeats=false){
 const {motor=0,brake=0,grip=0,brush=0,gearing=0,diffuser=0}=car.upgrades??{};
 const metal=(color,metalness=.65,roughness=.25)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 block(root,'Piastra telaio','#3c4852',[.236,.006,.10],[0,.007,0]);
 const axleMaterial=metal('#a5abb0');
 for(const x of [-.091,.096]){
   const axle=mechanicalMesh(root,'Asse rettificato',new THREE.CylinderGeometry(.003,.003,.149,10),axleMaterial,[x,.033,0]);
   axle.rotation.x=Math.PI*.5;
 }
 const motorLength=.051+Math.sqrt(motor)*.0053;
 const can=mechanicalMesh(root,'Cassa motore',new THREE.CylinderGeometry(.015,.015,motorLength,20),
   metal(motor?'#b99b76':'#677481'),[-.06,.019,0]);can.rotation.x=Math.PI*.5;
 const windMaterial=metal('#ce8746',.74,.24);
 for(let i=0;i<4+Math.floor(motor/3);i++){
   mechanicalMesh(root,'Avvolgimento',new THREE.TorusGeometry(.0152,.0011,6,16),
     windMaterial,[-.06,.019,-.018+i*.004]);
 }
 if(motor){
   block(root,'Dissipatore motore','#65747b',[.043,.005,.045],[-.062,.035,0],.75);
   for(let i=0;i<3+Math.floor(motor/4);i++)block(root,'Aletta dissipatore','#a6bcc1',[.002,.010+motor*.0004,.043],[-.08+i*.005,.040,0],.8);
 }
 if(grip)block(root,'Magnete di trazione','#58627a',[.017+grip*.001,.009,.076],[0,.002,0],.8);
 if(brake){block(root,'Scheda freno dinamico','#176656',[.032,.008,.036],[.042,.001,0]);
   for(const side of [-1,1])block(root,'Contatto freno','#e8ac45',[.024,.005,.006],[.042,-.004,side*.009]);
   for(const x of [-.091,.096])for(const side of [-1,1])block(root,'Pinza','#e66b36',[.009+brake*.00035,.016,.004],[x+.012,.033,side*.09]);
 }
 if(brush)for(const side of [-1,1]){
   for(let strand=0;strand<4;strand++)block(root,'Treccia in rame','#c9874c',[.029+brush*.0004,.002,.0018],[.099,-.002,side*(.013+.002*strand)],.82);
 }
 if(gearing){
   const crown=mechanicalMesh(root,'Corona dentata',new THREE.CylinderGeometry(.017,.017,.007,24),metal('#c89c50'),[-.091,.033,.027]);
   crown.rotation.x=Math.PI/2;
   for(let i=0;i<12;i++){const a=i*Math.PI/6;block(root,'Dente corona','#dbad60',[.004,.004,.007],[-.091+.017*Math.cos(a),.033+.017*Math.sin(a),.027],.72);}
 }
 if(diffuser)for(let i=-2;i<=2;i++)block(root,'Deriva fondo','#394752',[.047,.008+diffuser*.00015,.002],[-.109,.007,i*.017],.55).rotation.z=-.12;
 if(hasSeats)return;
 const fabric=car.appearance?.seat||'#333e49';
 const profile=new THREE.Shape();
 profile.moveTo(-.020,0);profile.lineTo(.016,0);profile.quadraticCurveTo(.021,.001,.019,.006);
 profile.lineTo(-.009,.008);profile.lineTo(-.015,.035);profile.quadraticCurveTo(-.024,.040,-.024,.031);profile.lineTo(-.020,0);
 const seatMaterial=metal(fabric,.06,.86);
 for(const side of [-1,1]){
   const z=side*.022;
   mechanicalMesh(root,'Sedile a guscio',new THREE.ExtrudeGeometry(profile,{depth:.026,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2,steps:1}),
     seatMaterial,[-.005,.059,z-.013]);
   for(const offset of [-.006,.006]){
     const strap=block(root,'Cintura','#d26048',[.002,.025,.003],[-.017,.080,z+offset],.04);strap.rotation.z=.20;
   }
 }
}
// Keep the small recurring fixtures in material batches so every drawer and tool
// is visible without issuing a draw call per handle.
export function atelierRoom(){
 const root=new THREE.Group(), batches=new Map(), stamp=new THREE.Object3D();
 const shapes={box:new THREE.BoxGeometry(), round:new THREE.CylinderGeometry(.5,.5,1,16), ring:new THREE.TorusGeometry(.39,.11,7,16)};
 const palette={
   enamel:['#245054',.37,.4], dark:['#243137',.43,.46], rubber:['#29282a',.02,.83],
   steel:['#bac3b9',.74,.29], oak:['#af835d',.12,.48], copper:['#d88c53',.64,.31],
   wall:['#68716e',.06,.83], floor:['#485358',.16,.60], ivory:['#d6cfc0',.20,.47],
   red:['#9e453b',.29,.47], blue:['#406776',.3,.45], lamp:['#fff0cd',.05,.29],
   pane:['#aabfc4',.3,.32], perforated:['#717772',.52,.52]
 };
 const mats={};
 for(const [key,[color,metalness,roughness]] of Object.entries(palette))
   mats[key]=new THREE.MeshStandardMaterial({color,metalness,roughness});
 mats.lamp.emissive.set('#ffe7ba');mats.lamp.emissiveIntensity=1.6;
 mats.pane.emissive.set('#9abfc9');mats.pane.emissiveIntensity=.53;
 function surface(material,size,repeat,pixel){
   const data=new Uint8Array(size*size*4);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
     const value=pixel(x,y);data.set([value,value,value,255],(y*size+x)*4);
   }
   const texture=new THREE.DataTexture(data,size,size);
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(...repeat);
   texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
   texture.generateMipmaps=true;texture.needsUpdate=true;material.map=texture;
 }
 surface(mats.floor,64,[10,10],(x,y)=> x===0||y===0?138:212+(Math.imul(x+31,y+79)%36));
 surface(mats.perforated,16,[42,16],(x,y)=>Math.hypot(x-8,y-8)<2.7?54:224);
 function add(material,size,pos,rot=[0,0,0],shape='box'){
   const key=material+' '+shape;if(!batches.has(key))batches.set(key,[]);
   stamp.position.set(...pos);stamp.rotation.set(...rot);stamp.scale.set(...size);
   stamp.updateMatrix();batches.get(key).push(stamp.matrix.clone());
 }
 add('floor',[3,.04,3],[0,-.28,0]);
 add('dark',[.72,.245,.72],[0,-.137,0],[0,0,0],'round');
 add('steel',[.76,.011,.76],[0,-.011,0],[0,0,0],'round');
 add('rubber',[.755,.009,.755],[0,-.001,0],[0,0,0],'round');
 for(const offset of [-1,-.50,0,.50,1]){
   add('dark',[2.85,.001,.004],[0,-.258,offset]);
   add('dark',[.004,.001,2.85],[offset,-.258,0]);
 }
 // Two narrow lift saddles leave the motor and brake board visible from below.
 add('dark',[.26,.019,.19],[0,.014,0]);
 for(const z of [-.048,.048]){
   for(const tilt of [-.64,.64])add('copper',[.010,.243,.012],[0,.118,z],[0,0,tilt]);
   add('steel',[.213,.011,.018],[0,.217,z]);
   for(const x of [-.081,.081])add('rubber',[.029,.010,.023],[x,.227,z]);
 }
 for(const side of [-1,1]){
   const z=v=>side*v;
   add('wall',[3,1.35,.05],[0,.36,z(1.46)]);
   add('dark',[.04,1.35,3],[side*1.48,.36,0]);
   add('enamel',[3,.36,.018],[0,-.07,z(1.425)]);
   add('copper',[3,.014,.014],[0,.113,z(1.41)]);
   // Machinist's bench with oiled hardwood top, drawers and a perforated tool wall.
   add('dark',[1.63,.038,.29],[-.21,.03,z(1.18)]);
   add('oak',[1.64,.027,.30],[-.21,.062,z(1.18)]);
   add('perforated',[1.55,.32,.02],[-.21,.28,z(1.39)]);
   for(const x of [-.76,-.20,.35]){
     add('dark',[.45,.25,.23],[x,-.109,z(1.21)]);
     for(let i=0;i<4;i++){
       const y=-.208+i*.055;
       add('enamel',[.425,.048,.018],[x,y,z(1.083)]);
       add('steel',[.25,.009,.012],[x,y+.008,z(1.066)]);
     }
   }
   for(let i=0;i<7;i++){
     const x=-.85+i*.074,h=.071+.006*i;
     add('steel',[.011,h,.008],[x,.245,z(1.366)],[0,0,-.11]);
     add('steel',[.042,.042,.03],[x+.004,.245+h/2,z(1.36)],[0,0,0],'ring');
   }
   for(let i=0;i<5;i++){
     const x=.00+i*.066;
     add('steel',[.006,.065,.006],[x,.29,z(1.36)]);
     add(i%2?'red':'rubber',[.019,.052,.018],[x,.235,z(1.36)],[0,0,0],'round');
   }
   add('dark',[1.6,.034,.18],[-.21,.49,z(1.33)]);
   add('lamp',[1.46,.012,.022],[-.21,.468,z(1.25)]);
   // Rubber work mat, screw-top oil bottles, and casting and jaws of a bench vice.
   add('rubber',[.41,.006,.18],[-.24,.079,z(1.16)]);
   for(let i=0;i<4;i++){
     const x=.21+i*.064;
     add(i%2?'ivory':'blue',[.041,.069,.041],[x,.113,z(1.25)],[0,0,0],'round');
     add('rubber',[.023,.014,.023],[x,.154,z(1.25)],[0,0,0],'round');
   }
   add('blue',[.14,.025,.11],[-.81,.092,z(1.11)]);
   for(const x of [-.85,-.78]){
     add('blue',[.034,.042,.073],[x,.121,z(1.11)]);
     add('steel',[.038,.015,.083],[x,.15,z(1.11)]);
   }
   add('steel',[.005,.081,.005],[-.897,.113,z(1.11)],[.32,0,0],'round');
   // Daylit high windows opposite one another give the garage depth on orbit.
   add('pane',[.018,.44,1.82],[side*1.445,.48,.02]);
   for(const y of [.255,.49,.71])add('dark',[.025,.018,1.88],[side*1.422,y,.02]);
   for(const z of [-.91,-.45,0,.45,.95])add('dark',[.025,.47,.020],[side*1.420,.483,z]);
   for(let i=0;i<4;i++){
     add('rubber',[.20,.20,.13],[.97,-.227+i*.064,z(1.13)],[Math.PI/2,0,0],'ring');
   }
   add('dark',[1.78,.046,.073],[0,.78,z(.87)]);
   add('lamp',[1.72,.015,.061],[0,.751,z(.87)]);
 }
 // Suspended inspection grid and enamel drawer banks on both sides of the bench.
 for(const side of [-1,1]){
   for(let i=0;i<5;i++){
     const x=(i-2)*.43;
     add('steel',[.020,.035,1.85],[x,.83,0]);
     add('lamp',[.012,.011,.57],[x,.807,side*.56]);
     add('blue',[.405,.24,.11],[x,.02,side*1.25]);
     for(let j=0;j<3;j++)add('steel',[.26,.009,.015],[x,-.05+j*.066,side*1.18]);
   }
 }
 for(const [key,matrices] of batches){
   const [material,shape]=key.split(' '), mesh=new THREE.InstancedMesh(shapes[shape],mats[material],matrices.length);
   matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
   mesh.name='Officina / '+key;mesh.receiveShadow=true;mesh.userData.ownTexture=!!mats[material].map;
   root.add(mesh);
 }
 return root;
}
// Long softboxes give silver rails and bodywork readable highlights on mobile as well.
export function reflectionMap(){
 const w=128,h=64,pixels=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const strip=(y>38&&y<43&&x%64<45)||(y>20&&y<51&&x%64<4);
   const v=strip?238:28+Math.round(y*.65),i=4*(y*w+x);pixels.set([v,Math.min(255,v+5),Math.min(255,v+10),255],i);
 }
 const map=new THREE.DataTexture(pixels,w,h);map.mapping=THREE.EquirectangularReflectionMapping;map.needsUpdate=true;return map;
}
