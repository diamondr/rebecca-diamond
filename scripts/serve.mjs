import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../docs');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.svg':'image/svg+xml','.bib':'text/plain; charset=utf-8','.xml':'application/xml','.pdf':'application/pdf','.ttf':'font/ttf'};
const port = Number(process.env.PORT || 4173);
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file = path.resolve(root,'.'+pathname);
    if(file !== root && !file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    if((await stat(file)).isDirectory()) {
      if(!pathname.endsWith('/')) {res.writeHead(301,{Location:pathname+'/'});res.end();return;}
      file=path.join(file,'index.html');
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(root,'404.html')));}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
