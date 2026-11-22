/** Depth-tested fallback for the actual GLB triangles. Centroid sorting alone
 * makes layered bodywork and glass cut through each other at oblique angles. */
export function rasterizeTriangles(image,points,faces,left=0,top=0){
 const {width:w,height:h,data}=image,depth=new Float64Array(w*h);depth.fill(Infinity);
 function triangle(f,transparent){
  const a=points[f.ia],b=points[f.ib],c=points[f.ic];
  const ax=a.x-left,ay=a.y-top,bx=b.x-left,by=b.y-top,cx=c.x-left,cy=c.y-top;
  const denominator=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if(Math.abs(denominator)<1e-9)return;
  const xmin=Math.max(0,Math.floor(Math.min(ax,bx,cx))),xmax=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
  const ymin=Math.max(0,Math.floor(Math.min(ay,by,cy))),ymax=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
  if(!f.rgb){const color=parseInt(f.shade.slice(1),16);f.rgb=[color>>16&255,color>>8&255,color&255];}
  const [r,g,blue]=f.rgb,alpha=f.opacity;
  for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
   const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/denominator;
   const v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/denominator,t=1-u-v;
   if(u< -1e-9||v< -1e-9||t< -1e-9)continue;
   const at=y*w+x,z=u*a.z+v*b.z+t*c.z;if(z>depth[at]+1e-10)continue;
   const i=at*4;
   if(!transparent){depth[at]=z;data[i]=r;data[i+1]=g;data[i+2]=blue;data[i+3]=255;}
   else{
    const back=data[i+3]/255,opacity=alpha+back*(1-alpha),factor=back*(1-alpha);
    if(opacity<=0)continue;
    data[i]=(r*alpha+data[i]*factor)/opacity;data[i+1]=(g*alpha+data[i+1]*factor)/opacity;data[i+2]=(blue*alpha+data[i+2]*factor)/opacity;data[i+3]=opacity*255;
   }
  }
 }
 for(const f of faces)if(f.opacity>=1)triangle(f,false);
 for(const f of faces.filter(f=>f.opacity<1).sort((a,b)=>b.depth-a.depth))triangle(f,true);
 return image;
}
