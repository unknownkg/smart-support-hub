import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {parseArgs} from 'node:util';

// Локальная статическая раздача с префиксом Pages, без копии проекта.
const {values}=parseArgs({options:{port:{type:'string',default:'8080'},prefix:{type:'string',default:'/'}}});
const port=Number(values.port),prefix=values.prefix;
if(!Number.isInteger(port)||port<1024||port>65535||!/^\/(?:[\w-]+\/)*$/.test(prefix)){
  throw new Error('Укажите порт 1024–65535 и префикс вида /smart-support-hub/.');
}
const root=resolve('.');
const roots=new Set(['index.html','deployments.html','incidents.html','maintenance.html','releases.html','README.md','CHANGELOG.md','THIRD_PARTY_NOTICES.md','.nojekyll']);
const allowed=path=>roots.has(path)||path.startsWith('assets/')||path==='docs/USER_GUIDE.md'||path==='docs/TEST_RESULTS.md'||path.startsWith('docs/screenshots/');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!pathname.startsWith(prefix)){res.writeHead(404);res.end('Не найдено');return;}
    const name=pathname.slice(prefix.length)||'index.html';
    const file=resolve(root,name),inside=relative(root,file).replaceAll('\\','/');
    if(inside.startsWith('../')||!allowed(inside)){res.writeHead(404);res.end('Не найдено');return;}
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Не найдено');}
});
server.listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}${prefix}`));
