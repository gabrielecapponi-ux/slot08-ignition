import './version-assets.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of ['index.html','style.css','src','vendor','assets','docs','README.md','QA.md','.nojekyll'])await cp(path.join(root,name),path.join(dist,name),{recursive:true,filter:source=>path.basename(source)!=='worldkit.glb'});
console.log('Build complete: dist/ (static, offline, no runtime dependencies).');
