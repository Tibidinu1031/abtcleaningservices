import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT||5173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let relative=decodeURIComponent(url.pathname);
  if(relative==='/admin')relative='/admin.html';
  if(relative.endsWith('/'))relative+='index.html';
  if(relative.includes('\\')||relative.split('/').some(part=>part.startsWith('.'))||/\/(?:node_modules|cloudflare|scripts|tests)\//.test(relative)){res.writeHead(404);return res.end('Not found');}
  const file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Lexyns Clean: http://127.0.0.1:'+port));
