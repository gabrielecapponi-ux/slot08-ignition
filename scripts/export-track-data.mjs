import fs from 'node:fs/promises';
import {createTrack} from '../src/track/catalog.js';
const levels=[0,1,2].map(i=>{const t=createTrack(i),n=Math.ceil(t.length/.075);return{...t.level,length:t.length,bounds:t.bounds,gates:t.switches,samples:Array.from({length:n+1},(_,j)=>{const p=t.sample(j/n*t.length);return[p.x,p.y,p.z,p.tx,p.ty,p.curvature].map(v=>+v.toFixed(5));})};});
await fs.writeFile(new URL('../blender/track-data.json',import.meta.url),JSON.stringify(levels));
