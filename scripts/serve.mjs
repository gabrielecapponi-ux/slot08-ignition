import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(typeof process !== 'undefined' ? process.env.PORT || 4173 : 4173);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
export const server = http.createServer((req,res)=>{
  let url; try {url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const requested=path.resolve(root,'.'+(url==='/'?'/index.html':url));
  if(requested!==root&&!requested.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.stat(requested,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(requested)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    const stream=fs.createReadStream(requested);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log(`SLOT 08 ready: http://127.0.0.1:${port}`));
