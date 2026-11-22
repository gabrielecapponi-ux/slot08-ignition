import * as THREE from 'three';

export function showroomFrame(){
 const pad=typeof document!=='undefined'&&document.getElementById?.('orbit-pad');
 const canvas=typeof document!=='undefined'&&document.getElementById?.('game');
 const r=pad?.getBoundingClientRect(),v=canvas?.getBoundingClientRect();
 if(!r||!v||!r.width||!r.height||!v.width||!v.height)return {x:.5,y:.5,width:.9,height:.8};
 return {x:(r.left+r.width/2-v.left)/v.width,y:(r.top+r.height/2-v.top)/v.height,width:r.width/v.width,height:r.height/v.height};
}

/** Fit all eight body bounds corners inside the unobstructed preview area. */
export function fitShowroom(bounds,angle,elevation,aspect,frame,zoom=1,detail){
 const box=bounds??new THREE.Box3(new THREE.Vector3(-.18,0,-.10),new THREE.Vector3(.18,.14,.10));
 const center=detail?new THREE.Vector3(...detail):box.getCenter(new THREE.Vector3());
 const eyeDirection=new THREE.Vector3(Math.cos(angle)*Math.cos(elevation),Math.sin(elevation),Math.sin(angle)*Math.cos(elevation));
 const fov=38,tanY=Math.tan(fov*Math.PI/360),tanX=tanY*aspect;
 const min=detail?center.clone().addScalar(-.065):box.min,max=detail?center.clone().addScalar(.065):box.max;
 // Fit the complete orbit envelope once: the room must not breathe in/out as
 // a rotating car changes apparent width. The target remains the body centre.
 const radius=Math.hypot((max.x-min.x)/2,(max.z-min.z)/2),halfHeight=(max.y-min.y)/2;
 const sine=Math.abs(Math.sin(elevation)),cosine=Math.abs(Math.cos(elevation));
 const horizontal=tanX*frame.width*.88,vertical=tanY*frame.height*.86;
 const distance=Math.max(.16,radius*Math.hypot(1/horizontal,cosine)+halfHeight*sine,
   radius*(cosine+sine/vertical)+halfHeight*(sine+cosine/vertical));
 const target=center.clone();target.y+=.23;
 return {target,eye:target.clone().addScaledVector(eyeDirection,distance/zoom),fov};
}
