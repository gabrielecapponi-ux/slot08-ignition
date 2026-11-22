import './version-assets.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const name of ['index.html','manifest.webmanifest','style.css','src','vendor','assets','motion','docs','README.md','QA.md','.nojekyll'])await cp(path.join(root,name),path.join(dist,name),{recursive:true,filter:source=>!['worldkit.glb','scenery15.glb'].includes(path.basename(source))&&!/^scenery15-.*\.png$/.test(path.basename(source))});
console.log('Build complete: dist/ (static, offline, no runtime dependencies).');
