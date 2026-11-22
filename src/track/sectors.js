export const SECTORS=[
 ['Selva Ionica','#71ffb3','#103349','forest','spires'],['Riviera Orbitale','#ffba7e','#393160','coast','rings'],
 ['Faglia di Rame','#ffa268','#54293c','canyon','mesa'],['Ghiacciaio Prisma','#aff6ff','#254772','alpine','peaks'],
 ['Porto Magnetico','#79e3ff','#184559','harbor','towers'],['Distretto Neon','#ff8edd','#301c57','night','towers'],
 ['Mare di Titanio','#f9d27a','#225363','coast','rings'],['Vortice Viola','#c8a0ff','#342658','desert','spires'],
 ['Ponti di Orione','#90bfff','#243c65','alpine','peaks'],['Corona Solare','#ffdb88','#552a40','night','mesa']
];

// Draw once per background. The skyline wraps around the race panorama.
export function drawSector(ctx,w,h,id){
 const [,accent,sky,,motif]=SECTORS[id];
 const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#080d21');g.addColorStop(.43,sky);g.addColorStop(.58,accent);g.addColorStop(1,'#081322');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 let seed=173+id*71;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<120;i++){ctx.fillStyle=i%4?'#ffffff70':accent;ctx.fillRect(random()*w,random()*h*.44,1.5,1.5);}
 const x=w*(.22+.05*id),y=h*.34,r=h*(.065+.012*(id%3));
 ctx.fillStyle=accent;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 if(motif==='rings'||id===9){ctx.strokeStyle=accent;ctx.lineWidth=h*.009;ctx.beginPath();ctx.ellipse(x,y,r*1.8,r*.37,-.32,0,Math.PI*2);ctx.stroke();}
 for(let layer=0;layer<2;layer++){
  const floor=h*(.55+.07*layer),unit=w/(32+layer*8);ctx.fillStyle=layer?'#10202d':sky;
  ctx.beginPath();ctx.moveTo(-unit,h);
  for(let i=-1;i<=w/unit+1;i++){const left=i*unit,top=floor-h*(.015+random()*.13);
   ctx.lineTo(left,floor);
   if(motif==='towers'){ctx.lineTo(left,top);ctx.lineTo(left+unit*.6,top);ctx.lineTo(left+unit*.6,floor);}
   else if(motif==='mesa'){ctx.lineTo(left+unit*.23,top);ctx.lineTo(left+unit*.76,top);}
   else if(motif==='spires'){ctx.lineTo(left+unit*.63,top-h*.06);ctx.lineTo(left+unit*.68,top);}
   else ctx.lineTo(left+unit*.51,top);
  }
  ctx.lineTo(w+unit,h);ctx.closePath();ctx.fill();
 }
 ctx.strokeStyle=accent+'44';ctx.lineWidth=1;
 for(let i=0;i<10;i++){const y=h*(.62+.004*i*i);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
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
