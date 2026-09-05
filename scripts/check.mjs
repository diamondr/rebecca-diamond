import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'docs');
async function files(dir) {
  return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
}
const generated = await files(output);
const htmlFiles = generated.filter(f=>f.endsWith('.html'));
const documents = new Map(await Promise.all(htmlFiles.map(async f=>[f,await readFile(f,'utf8')])));
let linkCount=0;
for(const [file,html] of documents) {
  assert.equal((html.match(/<h1[\s>]/g)||[]).length, 1, `One H1: ${file}`);
  assert.match(html,/<html lang="en">/);
  assert.match(html,/<meta name="viewport"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${file}`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value=match[1].replaceAll('&amp;','&');
    if(/^(?:https?:|mailto:)/.test(value)) continue;
    const [pathname,hash] = value.split('#');
    const clean=decodeURIComponent(pathname.split('?')[0]);
    let target=clean?path.resolve(path.dirname(file),clean):file;
    assert.ok(target.startsWith(output+path.sep)||target===output,`Link escapes output: ${value}`);
    const info=await stat(target).catch(()=>null);
    assert.ok(info,`Missing target ${value} in ${file}`);
    if(info.isDirectory()) target=path.join(target,'index.html');
    assert.ok(await stat(target).catch(()=>null),`Missing page ${target}`);
    if(hash) assert.ok((documents.get(target)||'').includes(`id="${hash}"`),`Missing anchor ${value} in ${file}`);
    linkCount++;
  }
}
// Reading a paper must not require navigating through a duplicate detail page.
const home = documents.get(path.join(output,'index.html'));
const research = documents.get(path.join(output,'research/index.html'));
for (const html of [home,research]) {
  assert.ok(!html.includes('>Details</a>'));
  assert.match(html, /<details class="paper-abstract">/);
  assert.match(html, /aria-label="Curriculum vitae \(PDF\)"/);
  for (const m of html.matchAll(/<h3><a href="([^"]+)"/g)) assert.match(m[1],/^\.\.?\/files\/[^/]+\.pdf$/,'Paper titles open locally hosted PDFs directly');
}
const papers = JSON.parse(await readFile(path.join(root,'content/papers.json'),'utf8'));
assert.equal(papers.length,21,'All existing papers are retained');
assert.equal(new Set(papers.map(p=>p.slug)).size,21,'Unique paper URLs');
assert.equal(papers.filter(p=>p.recent).length,3);
assert.ok(papers.filter(p=>p.recent).every(p=>p.year===2026));
assert.ok(papers.filter(p=>p.recent).every(p=>p.abstract.length>100&&p.citation));
for(const html of documents.values()) {
  assert.ok(!/>(?:Code|Data|Replication|Awards|Featured press)<\//i.test(html),'No excluded sections or resource links');
}

const manifest = JSON.parse(await readFile(path.join(root,'content/pdf-manifest.json'),'utf8'));
assert.equal(manifest.length,23,'All original papers and CV are hosted locally');
assert.equal((await readdir(path.join(root,'files'))).length,23,'No stray downloads');
for (const record of manifest) {
  for (const base of [root,output]) {
    const bytes = await readFile(path.join(base,record.file));
    assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    assert.equal(bytes.length,record.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,`Original PDF preserved: ${record.file}`);
  }
}
for (const html of documents.values()) assert.ok(!html.includes('sharepoint.com'),'No SharePoint links');

// Exercise the actual browser script against a minimal DOM to verify filtering,
// Unicode matching, query restoration, empty states, and reset behavior.
const controls = {};
const element = props => ({hidden:false, listeners:{}, addEventListener(name,fn){this.listeners[name]=fn;},...props});
controls['paper-search']=element({value:'',focus(){this.focused=true;}});
controls['topic-filter']=element({value:'',options:['','Housing','Labor','Methods'].map(value=>({value}))});
controls['search-count']=element({textContent:''});
controls['no-results']=element({hidden:true});
controls['clear-search']=element({});
const rows = [
  element({dataset:{search:'GLP-1 Rebecca Diamond 2026',topics:'Labor'}}),
  element({dataset:{search:'Rental Property Stephanie Kestelman 2026',topics:'Housing'}}),
  element({dataset:{search:'Clustering Michal Kolesár 2012',topics:'Methods'}})
];
const group = element({id:'working-papers',querySelectorAll(){return rows;}});
const groupLink=element({});
const location={pathname:'/research/',search:'?q=kolesar',hash:''};
let lastUrl='';
const document={documentElement:{classList:{add(){}}},getElementById(id){return controls[id];},querySelectorAll(selector){return selector==='[data-paper]'?rows:[group];},querySelector(){return groupLink;}};
vm.runInNewContext(await readFile(path.join(root,'assets/research.js'),'utf8'),{document,location,history:{replaceState(_a,_b,url){lastUrl=url;}},URLSearchParams});
assert.deepEqual(rows.map(r=>r.hidden),[true,true,false],'Restore query and match diacritics');
controls['paper-search'].value='2026'; controls['topic-filter'].value='Housing'; controls['paper-search'].listeners.input();
assert.deepEqual(rows.map(r=>r.hidden),[true,false,true],'Combine search and topic');
assert.match(lastUrl,/q=2026&topic=Housing/);
controls['paper-search'].value='nonexistent'; controls['paper-search'].listeners.input();
assert.equal(controls['no-results'].hidden,false); assert.equal(group.hidden,true);
controls['clear-search'].listeners.click();
assert.ok(rows.every(r=>!r.hidden)); assert.equal(group.hidden,false); assert.equal(controls['no-results'].hidden,true); assert.equal(lastUrl,'/research/');
console.log(`Passed: ${htmlFiles.length} HTML pages, ${linkCount} internal links/assets, 23 original PDFs, research migration, and search interaction checks.`);
