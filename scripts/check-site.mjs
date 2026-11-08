import {readFile,access,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const pages=['index','deployments','incidents','maintenance','releases'];
const base=process.argv[2] || 'http://127.0.0.1:8080/';
const resources=new Set();
for(const page of pages){
  const file=`${page}.html`,html=await readFile(file,'utf8');
  const response=await fetch(new URL(file,base));assert.equal(response.status,200,file);
  assert.match(response.headers.get('content-type'),/text\/html/);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const ref=match[1];if(ref.startsWith('#')||/^https?:/.test(ref))continue;
    assert.ok(!ref.startsWith('/'),`Абсолютный путь: ${ref}`);await access(resolve(ref));resources.add(ref);
  }
}
for(const file of await readdir('assets/js')){
  if(!file.endsWith('.js'))continue;
  const path=`assets/js/${file}`,source=await readFile(path,'utf8');resources.add(path);
  for(const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g))await access(resolve(dirname(path),match[1]));
}
for(const file of await readdir('assets/css')){
  if(!file.endsWith('.css'))continue;
  const path=`assets/css/${file}`,source=await readFile(path,'utf8');
  for(const match of source.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g)){
    const target=relativePath(dirname(path),match[1]);
    await access(resolve(target));resources.add(target);
  }
}
function relativePath(folder,ref){
  assert.ok(!ref.startsWith('/')&&!/^https?:/.test(ref),`Нелокальный CSS-ресурс: ${ref}`);
  return `${folder}/${ref}`.split('/').reduce((parts,part)=>{if(part==='..')parts.pop();else if(part!=='.')parts.push(part);return parts;},[]).join('/');
}
for(const path of resources){const response=await fetch(new URL(path,base));assert.equal(response.status,200,path);if(path.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript/);}
console.log(`HTTP: ${pages.length} страниц и ${resources.size} локальных ресурсов доступны; импорты существуют, пути относительные.`);
