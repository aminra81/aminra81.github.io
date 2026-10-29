import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFile(path.join(root,file),'utf8');
const data=JSON.parse(await read('content/publications.json'));
const papers=Array.isArray(data)?data:data.publications;
assert(papers.length>0,'No publications');
assert.equal(new Set(papers.map(p=>p.id)).size,papers.length,'Duplicate paper IDs');
for(const p of papers){
  assert(p.title&&p.abstract&&p.authors.length,`Incomplete metadata: ${p.id}`);
  assert(new URL(p.paperUrl).protocol==='https:',`Invalid publication URL: ${p.id}`);
  assert(new URL(p.pdfUrl).protocol==='https:',`Invalid PDF URL: ${p.id}`);
  assert((await read(`assets/bib/${p.id}.bib`)).startsWith('@'),`Invalid BibTeX: ${p.id}`);
}
const pages=['index.html','publications.html','cv.html','misc.html'];
for(const page of pages){
  const html=await read(page);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`Expected one h1: ${page}`);
  assert(html.includes('aria-current="page"'),`Missing active navigation: ${page}`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`Duplicate IDs: ${page}`);
  for(const [,raw] of html.matchAll(/(?:href|src|data)="([^"]+)"/g)){
    const url=raw.replaceAll('&amp;','&');
    if(/^(https?:|mailto:)/.test(url))continue;
    const [file,hash]=url.split('#');
    const target=file||page;
    await access(path.join(root,target));
    if(hash&&target.endsWith('.html'))assert((await read(target)).includes(`id="${hash}"`),`Broken fragment ${url} in ${page}`);
  }
}
const pub=await read('publications.html');
assert.equal((pub.match(/<details>/g)||[]).length,papers.length,'Missing expandable abstracts');
assert((await readFile(path.join(root,'assets/cv.pdf'))).subarray(0,5).toString()==='%PDF-','CV is not a PDF');
for(const tag of ['Cryptography','AI','Algorithms','Systems'])assert(papers.some(p=>p.tags.includes(tag)),`Empty topic filter: ${tag}`);
console.log(`Passed: ${pages.length} pages, ${papers.length} expandable abstracts, internal links, topic filters, bibliography, and CV PDF.`);
