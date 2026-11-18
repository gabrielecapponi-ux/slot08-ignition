import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules={};
const files=async dir=>{for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const p=path.posix.join(dir,entry.name);if(entry.isDirectory())await files(p);else if(p.endsWith('.js'))modules[p]=await fs.readFile(path.join(root,p),'utf8');}};
await files('src');await files('vendor');
const glb='data:model/gltf-binary;base64,'+(await fs.readFile(path.join(root,'assets/slot08.glb'))).toString('base64');
modules['src/render/scene3d.js']=modules['src/render/scene3d.js'].replace("new URL('../../assets/slot08.glb',import.meta.url).href",JSON.stringify(glb));
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
const css=await fs.readFile(path.join(root,'style.css'),'utf8');
const poster='data:image/png;base64,'+(await fs.readFile(path.join(root,'assets/poster.png'))).toString('base64');
const readme='data:text/plain;base64,'+Buffer.from(await fs.readFile(path.join(root,'README.md'),'utf8')).toString('base64');
html=html.replace('href="./"','href="#"');
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace('src="assets/poster.png"',`src="${poster}"`).replace('href="README.md"',`href="${readme}" download="SLOT08_README.txt"`);
// Build Blob ES modules in dependency order. Original module scopes are preserved;
// this is packaging, not a second implementation or a string-eval module loader.
const boot=`
const sources=${JSON.stringify(modules).replaceAll('</','<\\/')};
const urls={};
function resolve(id,spec){
 if(spec==='three')return 'vendor/three.module.js';
 if(spec.startsWith('three/addons/'))return 'vendor/addons/'+spec.slice(13);
 const parts=(id.slice(0,id.lastIndexOf('/')+1)+spec).split('/'),out=[];
 for(const p of parts){if(p==='..')out.pop();else if(p!=='.'&&p)out.push(p);}return out.join('/');
}
function compile(id){
 if(urls[id])return urls[id];
 if(!sources[id])throw new Error('Missing module '+id);
 const source=sources[id].replace(/(^(?:import|export)\\s+(?:\\{[^}]*\\}|\\*\\s*(?:as\\s+\\w+\\s*)?|\\w+)\\s+from\\s*|import\\s*\\(\\s*)(['"])([^'"]+)\\2/gm,(match,prefix,quote,spec)=>prefix+quote+compile(resolve(id,spec))+quote);
 urls[id]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));return urls[id];
}
await import(compile('src/main.js'));
`;
html=html.replace('<script type="module" src="src/main.js"></script>',()=>`<script type="module">${boot}</script>`);
await fs.writeFile(path.join(root,'SLOT08.html'),html);
console.log(`Standalone ready: SLOT08.html (${Buffer.byteLength(html)} bytes, all assets embedded).`);
