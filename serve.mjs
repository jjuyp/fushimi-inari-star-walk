import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[3]||'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.ktx2':'image/ktx2','.wasm':'application/wasm','.json':'application/json','.md':'text/markdown; charset=utf-8'};
const port=Number(process.argv[2]||4185);
http.createServer((req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!existsSync(file)){res.writeHead(404);res.end('Not found');return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(500);res.end('Server error')}}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
