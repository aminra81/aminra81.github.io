import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(root, file), 'utf8');
const site = JSON.parse(await read('content/site.json'));
const research = JSON.parse(await read('content/publications.json'));
const papers = Array.isArray(research) ? research : research.publications;
const cssVersion = createHash('sha256').update(await read('assets/style.css')).digest('hex').slice(0, 10);
const jsVersion = createHash('sha256').update(await read('assets/site.js')).digest('hex').slice(0, 10);
const cvViewerVersion = createHash('sha256').update(await read('assets/cv-viewer.mjs')).digest('hex').slice(0, 10);
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const external = (href, text, cls = '') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}${arrow}<span class="sr-only"> (opens in a new tab)</span></a>`;
const links = (cls = '') => `<div class="social-links ${cls}" aria-label="Profile links">${external(site.github, 'GitHub')}${external(site.scholar, 'Google Scholar')}${external(site.linkedin, 'LinkedIn')}<a href="/cv/">CV <span aria-hidden="true">↗</span></a></div>`;
const abstractMath = new Map([
  ['(2 + \\varepsilon)', '<mrow><mo>(</mo><mn>2</mn><mo>+</mo><mi>ε</mi><mo>)</mo></mrow>'],
  ['\\tilde{O}(\\sqrt{\\log n})', '<mrow><mover accent="true"><mi>O</mi><mo>~</mo></mover><mo>(</mo><msqrt><mrow><mi mathvariant="normal">log</mi><mi>n</mi></mrow></msqrt><mo>)</mo></mrow>'],
  ['O(\\log n)', '<mrow><mi>O</mi><mo>(</mo><mi mathvariant="normal">log</mi><mi>n</mi><mo>)</mo></mrow>'],
  ['\\tilde{\\Omega}(n^{1/6})', '<mrow><mover accent="true"><mi>Ω</mi><mo>~</mo></mover><mo>(</mo><msup><mi>n</mi><mrow><mn>1</mn><mo>/</mo><mn>6</mn></mrow></msup><mo>)</mo></mrow>'],
  ['O(\\log^2 n)', '<mrow><mi>O</mi><mo>(</mo><msup><mi mathvariant="normal">log</mi><mn>2</mn></msup><mi>n</mi><mo>)</mo></mrow>']
]);
function renderAbstract(text) {
  return text.split(/\n\s*\n/).map(paragraph => {
    const content = paragraph.split(/(\$[^$]+\$)/g).map(part => {
      if (!part.startsWith('$') || !part.endsWith('$')) return esc(part);
      const formula = part.slice(1, -1);
      const math = abstractMath.get(formula);
      if (!math) throw new Error('Unsupported abstract formula: ' + formula);
      return '<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics>' + math + '<annotation encoding="application/x-tex">' + esc(formula) + '</annotation></semantics></math>';
    }).join('');
    return '<p>' + content + '</p>';
  }).join('');
}
function biographyParagraph(text) {
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)) {
    parts.push(esc(text.slice(cursor, match.index)));
    parts.push(`<a href="${esc(match[2])}" target="_blank" rel="noopener noreferrer">${esc(match[1])}</a>`);
    cursor = match.index + match[0].length;
  }
  parts.push(esc(text.slice(cursor)));
  return `<p>${parts.join('')}</p>`;
}
const authors = p => (Array.isArray(p.authors) ? p.authors : [p.authors]).map(name => {
  const label = /Raeisi/i.test(name) ? `<strong>${esc(name)}</strong>` : esc(name);
  return label + (p.equalContribution?.includes(name) ? '<sup aria-label="equal contribution">*</sup>' : '');
}).join(', ');
const paperCard = (p, compact = false) => `<article class="paper${compact ? ' paper-compact' : ''}" id="${esc(p.id)}" ${compact ? '' : `data-paper data-tags="${esc((p.tags || []).join(' '))}"`}>
  <div class="paper-meta"><span>${esc(p.venue || p.status || 'Preprint')}</span><span>${esc(p.year)}</span></div>
  <h${compact ? '3' : '2'}><a href="${esc(p.paperUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.title)} <span class="paper-title-arrow" aria-hidden="true">↗</span></a></h${compact ? '3' : '2'}>
  <p class="authors">${authors(p)}</p>
  ${p.contributionNote ? `<p class="contribution-note">* ${esc(p.contributionNote)}</p>` : ''}
  ${compact ? `<a class="text-link" href="/publications/#${esc(p.id)}">Read more <span aria-hidden="true">→</span></a>` : `<div class="paper-actions">${external(p.pdfUrl || p.paperUrl, 'Paper PDF')}${external(p.paperUrl, 'Publication')}<a href="/assets/bib/${esc(p.id)}.bib" download>BibTeX <span aria-hidden="true">↓</span></a></div>
  <details><summary>Abstract<span class="expand-symbol" aria-hidden="true"></span></summary><div class="abstract">${renderAbstract(p.abstract)}</div></details>`}
</article>`;

function layout(page, title, content) {
  const items = [['about', '/', 'About'], ['publications','/publications/','Publications'], ['cv','/cv/','CV'], ['misc','/misc/','Misc']];
  const canonical = new URL(items.find(i => i[0] === page)[1], site.siteUrl).href;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#0b1424"><title>${esc(title)} · ${esc(site.name)}</title>
<meta name="description" content="${esc(site.description)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} · ${esc(site.name)}"><meta property="og:description" content="${esc(site.description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(site.siteUrl)}/assets/portrait.jpg">
<link rel="icon" href="/assets/yale-favicon.png" type="image/png" sizes="96x96"><link rel="apple-touch-icon" href="/assets/yale-favicon.png"><link rel="stylesheet" href="/assets/style.css?v=${cssVersion}"><script src="/assets/site.js?v=${jsVersion}" defer></script>${page === 'cv' ? `<script type="module" src="/assets/cv-viewer.mjs?v=${cvViewerVersion}"></script>` : ''}</head>
<body data-page="${page}"><a class="skip-link" href="#main">Skip to content</a><div class="site-wrap">
<header class="site-header"><a class="wordmark" href="/" aria-label="${esc(site.name)}, home">${esc(site.shortName)}</a><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">Menu <span aria-hidden="true">+</span></button><nav id="navigation" aria-label="Main navigation">${items.map(([id,url,label])=>`<a href="${url}"${id === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></header>
<main id="main">${content}</main>
${['cv', 'misc'].includes(page) ? '' : `<footer class="site-footer"><p>© 2026 ${esc(site.name)}<span>${esc(site.affiliation)} · New Haven, CT</span></p><a href="mailto:${esc(site.email)}">Let’s get in touch ${arrow}</a><a class="back-top" href="#main">Back to top <span aria-hidden="true">↑</span></a></footer>`}</div></body></html>`.replace(/[ \t]+$/gm, '');
}

const intro = `<section class="about-page" aria-labelledby="name"><div class="about-copy"><h1 id="name">${esc(site.name)}</h1><p class="role-line">Ph.D. student · Computer Science<br><a href="https://www.yale.edu/" target="_blank" rel="noopener noreferrer">${esc(site.affiliation)}</a></p><div class="biography">${site.bio.map(biographyParagraph).join('')}</div>${links()}</div><aside class="profile-sidebar" aria-label="Photo and contact"><figure class="profile-photo"><img src="/assets/portrait.jpg" alt="Mohammad Amin Raeisi outdoors in a mountain landscape" width="960" height="1280" fetchpriority="high"></figure><div class="profile-contact"><p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(site.location)}</span></p><p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></svg><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p></div></aside></section>`;

const pub = `<section class="page-intro"><p class="eyebrow">Papers & preprints</p><h1>Publications<span class="accent">.</span></h1>${external(site.scholar,'View Google Scholar','text-link')}</section>
<section aria-label="Publication list"><div class="publication-controls" hidden data-controls><label class="search-box"><span class="sr-only">Search publications</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input type="search" id="paper-search" placeholder="Search titles, authors, or topics…" autocomplete="off"></label><div class="filter-buttons" role="group" aria-label="Filter publications by topic"><button type="button" class="filter active" data-filter="all" aria-pressed="true">All</button>${['Cryptography','AI','Algorithms','Systems'].map(t=>`<button type="button" class="filter" data-filter="${t}" aria-pressed="false">${t}</button>`).join('')}</div></div><div class="publication-count"><p data-result-count role="status" aria-live="polite">${papers.length} publications</p><a href="/assets/publications.bib" download>Download bibliography <span aria-hidden="true">↓</span></a></div><div class="publication-list">${papers.map(p=>paperCard(p)).join('')}</div><p class="empty-state" hidden data-empty>No papers match that search. Try a different title, author, or topic.</p></section>`;

const cv = `<section class="cv-page" aria-labelledby="cv-title"><h1 id="cv-title" class="sr-only">Curriculum vitae</h1><div class="cv-actions"><a class="button" href="/assets/cv.pdf" target="_blank" rel="noopener noreferrer">Download CV <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></div><div class="cv-document" id="cv-document" aria-label="CV PDF" aria-busy="true"></div><noscript><iframe class="pdf-viewer" src="/assets/cv.pdf#view=FitH" title="Mohammad Amin Raeisi curriculum vitae"></iframe></noscript></section>`;

const misc = `<section class="misc-placeholder" aria-labelledby="misc-title"><svg class="tbd-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><h1 id="misc-title">TBD</h1></section>`;

const pages = [['index.html','about','About',intro],['publications/index.html','publications','Publications',pub],['cv/index.html','cv','CV',cv],['misc/index.html','misc','Misc',misc]];
for (const [file, page, title, content] of pages) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), layout(page, title, content));
}
// Keep previously shared .html links working while directing visitors to clean URLs.
for (const slug of ['publications', 'cv', 'misc']) {
  const target = '/' + slug + '/';
  const canonical = new URL(target, site.siteUrl).href;
  await writeFile(path.join(root, slug + '.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Redirecting…</title><link rel="canonical" href="${esc(canonical)}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
<noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript></head>
<body><p>This page has moved to <a href="${target}">${target}</a>.</p></body></html>`);
}
await mkdir(path.join(root,'assets/bib'),{recursive:true});
function bib(p) {
  if (p.bibtex) return p.bibtex.trim() + '\n';
  return `@article{${p.id.replace(/-/g,'')}${p.year},\n  title = {${p.title}},\n  author = {${(Array.isArray(p.authors)?p.authors:[p.authors]).map(n=>n.replace(/\*/g,'')).join(' and ')}},\n  year = {${p.year}},\n  url = {${p.paperUrl}}\n}\n`;
}
for(const p of papers) await writeFile(path.join(root,`assets/bib/${p.id}.bib`),bib(p));
await writeFile(path.join(root,'assets/publications.bib'),papers.map(bib).join('\n'));
console.log(`Built 4 pages and ${papers.length} bibliography entries.`);
