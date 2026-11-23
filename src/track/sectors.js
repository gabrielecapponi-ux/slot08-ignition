export const SECTORS=[
 ['Selva Ionica','#71ffb3','#103349','forest','spires'],['Riviera Orbitale','#ffba7e','#393160','coast','rings'],
 ['Faglia di Rame','#ffa268','#54293c','canyon','mesa'],['Ghiacciaio Prisma','#aff6ff','#254772','alpine','peaks'],
 ['Porto Magnetico','#79e3ff','#184559','harbor','towers'],['Distretto Neon','#ff8edd','#301c57','night','towers'],
 ['Mare di Titanio','#f9d27a','#225363','titan','rings'],['Vortice Viola','#c8a0ff','#342658','desert','spires'],
 ['Ponti di Orione','#90bfff','#243c65','orion','peaks'],['Corona Solare','#ffdb88','#552a40','solar','mesa']
];

// Draw once per background. The skyline wraps around the race panorama.
export function drawSector(ctx,w,h,id){
 const [,accent,sky,,motif]=SECTORS[id];
 const palettes=[
   ['#376685','#edf0ca','#344f42'],['#3c6895','#ffcf9f','#455767'],
   ['#5f637f','#f1b382','#62443c'],['#4b76a2','#e5eff5','#425c72'],
   ['#475776','#f8b58c','#384856'],['#101429','#69618f','#24253c'],
   ['#436a83','#cce3d8','#3d6071'],['#554873','#dfa4a6','#534258'],
   ['#383b68','#d4d9f1','#444762'],['#7b506a','#ffc087','#674451']
 ];
 const [zenith,haze,rock]=palettes[id],g=ctx.createLinearGradient(0,0,0,h);
 g.addColorStop(0,zenith);g.addColorStop(.49,haze);g.addColorStop(.65,rock);g.addColorStop(1,'#161f28');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 let seed=173+id*71;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const sx=w*(.19+.051*id),sy=h*(id===5?.26:.34);
 const glow=ctx.createRadialGradient(sx,sy,0,sx,sy,h*.26);
 glow.addColorStop(0,'#fff3d8dc');glow.addColorStop(.10,accent+'66');glow.addColorStop(1,accent+'00');
 ctx.fillStyle=glow;ctx.fillRect(sx-h*.26,sy-h*.26,h*.52,h*.52);
 ctx.fillStyle=id===5?'#e4ddff':'#fff4db';ctx.beginPath();ctx.arc(sx,sy,h*(id===5?.014:.021),0,Math.PI*2);ctx.fill();
 if(motif==='rings'||id===9){ctx.strokeStyle=accent+'ac';ctx.lineWidth=h*.003;ctx.beginPath();ctx.ellipse(sx,sy,h*.049,h*.009,-.30,0,Math.PI*2);ctx.stroke();}
 for(let layer=0;layer<4;layer++){
   const floor=h*(.50+layer*.035),amp=h*(motif==='peaks'?.16:motif==='mesa'?.105:.065);
   const ridge=x=>{
     const a=2*Math.PI*x/w,phase=id*.83+layer*1.32;
     let f=.55+.26*Math.sin(a*(3+layer)+phase)+.14*Math.cos(7*a-phase)+.075*Math.sin(15*a+phase)+.035*Math.cos(39*a);
     if(motif==='mesa')f=Math.min(.72,f)*1.3;
     return floor-amp*f;
   };
   const step=w/480;
   ctx.fillStyle=rock;ctx.globalAlpha=.29+layer*.19;
   ctx.beginPath();ctx.moveTo(0,h);
   for(let i=0;i<=480;i++)ctx.lineTo(i*step,ridge(i*step));
   ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
   for(let i=0;i<480;i++){
     const x=i*step,y=ridge(x),yn=ridge(x+step),drop=amp*(.10+random()*.40);
     if(motif==='peaks'||motif==='mesa'){
       ctx.fillStyle=motif==='peaks'&&y<floor-amp*.59?'#edf4f5':yn>y?haze:rock;
       ctx.globalAlpha=.17+layer*.07;
       ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+step,yn);ctx.lineTo(x+step+drop*.25,y+drop);ctx.fill();
     }else if(motif==='towers'&&layer===2&&i%5===0){
       const height=h*(.014+random()*.072),width=w*(.002+random()*.006);
       ctx.fillStyle=rock;ctx.globalAlpha=.94;ctx.fillRect(x,y-height,width,height+1);
       ctx.fillRect(x+width*.25,y-height-h*.004,width*.5,h*.006);
       ctx.fillStyle=accent;ctx.globalAlpha=.62;
       for(let dy=h*.005;dy<height;dy+=h*.009)ctx.fillRect(x+width*.16,y-height+dy,width*.58,h*.0017);
     }else if(id===0&&layer===3){
       ctx.globalAlpha=.9;ctx.fillStyle=rock;ctx.beginPath();ctx.moveTo(x-step,y+1);ctx.lineTo(x,y-h*(.004+random()*.018));ctx.lineTo(x+step,y+1);ctx.fill();
     }
   }
   ctx.globalAlpha=1;
 }

}

const SIGILS=[
 'M4 21 12 3l8 18-8-6z','M2 16q10-21 20-5Q12 26 2 16zm7-3 7-3','M3 19 10 5l2 8 8-6-5 13z',
 'M2 19 9 6l3 4 3-7 7 16z','M3 21V8h6v13m3 0V3h4v18m3 0V11h3v10','M14 2 4 14h7l-1 8 11-14h-8z',
 'M2 12q5-8 10 0t10 0M2 18q5-8 10 0t10 0','M21 12a9 9 0 1 1-6-8q9 3 2 12-6 5-8-2-1-5 4-4',
 'M2 16h20M5 21V6m14 15V6M5 7q7 15 14 0','M2 7l6 5 4-9 4 9 6-5-3 13H5z'
];
export function worldIcon(id){
 return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="${SIGILS[id]}"/></svg>`;
}
