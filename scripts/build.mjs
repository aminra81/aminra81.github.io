import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(root, file), 'utf8');
const site = JSON.parse(await read('content/site.json'));
const research = JSON.parse(await read('content/publications.json'));
const papers = Array.isArray(research) ? research : research.publications;
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const external = (href, text, cls = '') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}${arrow}<span class="sr-only"> (opens in a new tab)</span></a>`;
const links = (cls = '') => `<div class="social-links ${cls}">${external(site.github, 'GitHub')}${external(site.scholar, 'Scholar')}${external(site.linkedin, 'LinkedIn')}<a href="mailto:${esc(site.email)}">Email ${arrow}</a></div>`;
const authors = p => (Array.isArray(p.authors) ? p.authors : [p.authors]).map(name => {
  const label = /Raeisi/i.test(name) ? `<strong>${esc(name)}</strong>` : esc(name);
  return label + (p.equalContribution?.includes(name) ? '<sup aria-label="equal contribution">*</sup>' : '');
}).join(', ');
const paperCard = (p, compact = false) => `<article class="paper${compact ? ' paper-compact' : ''}" id="${esc(p.id)}" ${compact ? '' : `data-paper data-tags="${esc((p.tags || []).join(' '))}"`}>
  <div class="paper-meta"><span>${esc(p.venue || p.status || 'Preprint')}</span><span>${esc(p.year)}</span></div>
  <h${compact ? '3' : '2'}><a href="${esc(p.paperUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.title)} <span class="paper-title-arrow" aria-hidden="true">↗</span></a></h${compact ? '3' : '2'}>
  <p class="authors">${authors(p)}</p>
  ${p.contributionNote ? `<p class="contribution-note">* ${esc(p.contributionNote)}</p>` : ''}
  ${compact ? `<a class="text-link" href="publications.html#${esc(p.id)}">Read more <span aria-hidden="true">→</span></a>` : `<div class="paper-actions">${external(p.pdfUrl || p.paperUrl, 'Paper PDF')}${external(p.paperUrl, 'Publication')}<a href="assets/bib/${esc(p.id)}.bib" download>BibTeX <span aria-hidden="true">↓</span></a></div>
  <details><summary>${p.abstractType === 'summary' ? 'Abstract summary' : 'Abstract'}<span class="expand-symbol" aria-hidden="true"></span></summary><div class="abstract"><p>${esc(p.abstract)}</p>${p.abstractType === 'summary' ? '<p class="abstract-note">A short summary of the paper. See the linked publication for the full abstract.</p>' : ''}</div></details>`}
</article>`;

function layout(page, title, content) {
  const items = [['about', 'index.html', 'About'], ['publications','publications.html','Publications'], ['cv','cv.html','CV'], ['misc','misc.html','Misc']];
  const canonical = site.siteUrl + '/' + (page === 'about' ? '' : items.find(i => i[0] === page)[1]);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#101613"><title>${esc(title)} · ${esc(site.name)}</title>
<meta name="description" content="${esc(site.description)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} · ${esc(site.name)}"><meta property="og:description" content="${esc(site.description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(site.siteUrl)}/assets/portrait.jpg">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"><script src="assets/site.js" defer></script></head>
<body data-page="${page}"><a class="skip-link" href="#main">Skip to content</a><div class="site-wrap">
<header class="site-header"><a class="wordmark" href="index.html" aria-label="${esc(site.name)}, home"><span class="monogram" aria-hidden="true">ar<span>.</span></span><span>${esc(site.shortName)}</span></a><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">Menu <span aria-hidden="true">+</span></button><nav id="navigation" aria-label="Main navigation">${items.map(([id,url,label])=>`<a href="${url}"${id === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></header>
<main id="main">${content}</main>
<footer class="site-footer"><p>© 2026 ${esc(site.name)}<span>${esc(site.affiliation)} · New Haven, CT</span></p><a href="mailto:${esc(site.email)}">Let’s get in touch ${arrow}</a><a class="back-top" href="#main">Back to top <span aria-hidden="true">↑</span></a></footer></div></body></html>`;
}

const intro = `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>Computer Science · Yale University</p><h1>Mohammad<br>Amin <em>Raeisi.</em></h1><p class="hero-intro">${esc(site.intro)}</p>${links()}<a class="button hero-cta" href="publications.html">Explore my research <span aria-hidden="true">↗</span></a></div><figure class="portrait"><img src="assets/portrait.jpg" alt="Mohammad Amin Raeisi outdoors in a mountain landscape" width="960" height="1280" fetchpriority="high"><figcaption><span>Currently in</span> New Haven, CT <span aria-hidden="true">↗</span></figcaption><div class="portrait-index" aria-hidden="true">01 / A LITTLE ABOUT ME</div></figure></section>
<section class="section split-section" aria-labelledby="about-title"><div class="section-label"><span class="section-number">01</span><h2 id="about-title">A little background</h2></div><div class="prose">${site.bio.map(p=>`<p>${esc(p)}</p>`).join('')}<a class="text-link" href="cv.html">My curriculum vitae <span aria-hidden="true">→</span></a></div></section>
<section class="section" aria-labelledby="research-title"><div class="section-heading"><div class="section-label"><span class="section-number">02</span><h2 id="research-title">What I think about</h2></div><span class="section-aside">Research interests</span></div><div class="interest-list">${site.interests.map((i,n)=>`<div class="interest"><span class="interest-index">0${n+1}</span><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join('')}</div></section>
<section class="section" aria-labelledby="selected-title"><div class="section-heading"><div class="section-label"><span class="section-number">03</span><h2 id="selected-title">Selected work</h2></div><a class="text-link" href="publications.html">All publications <span aria-hidden="true">↗</span></a></div><div class="selected-papers">${papers.slice(0,2).map(p=>paperCard(p,true)).join('')}</div></section>`;

const pub = `<section class="page-intro"><p class="eyebrow">Papers & preprints</p><h1>Publications<span class="accent">.</span></h1><p>Work on cryptography, secure systems, and algorithms.</p>${external(site.scholar,'View Google Scholar','text-link')}</section>
<section aria-label="Publication list"><div class="publication-controls" hidden data-controls><label class="search-box"><span class="sr-only">Search publications</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input type="search" id="paper-search" placeholder="Search titles, authors, or topics…" autocomplete="off"></label><div class="filter-buttons" role="group" aria-label="Filter publications by topic"><button type="button" class="filter active" data-filter="all" aria-pressed="true">All</button>${['Cryptography','AI','Algorithms','Systems'].map(t=>`<button type="button" class="filter" data-filter="${t}" aria-pressed="false">${t}</button>`).join('')}</div></div><div class="publication-count"><p data-result-count role="status" aria-live="polite">${papers.length} publications</p><a href="assets/publications.bib" download>Download bibliography <span aria-hidden="true">↓</span></a></div><div class="publication-list">${papers.map(p=>paperCard(p)).join('')}</div><p class="empty-state" hidden data-empty>No papers match that search. Try a different title, author, or topic.</p></section>`;

const cv = `<section class="page-intro cv-intro"><div><p class="eyebrow">Education, research & experience</p><h1>Curriculum vitae<span class="accent">.</span></h1><p>A fuller picture of my academic work.</p></div><a class="button" href="assets/cv.pdf" download="Mohammad-Amin-Raeisi-CV.pdf">Download CV <span aria-hidden="true">↓</span></a></section>
<section class="cv-overview" aria-label="Education"><h2 class="small-heading">Education</h2><div>${site.education.map(e=>`<div class="education-row"><div><h3>${esc(e.institution)}</h3><p>${esc(e.degree)}</p></div><p>${esc(e.dates)}<span>${esc(e.place)}</span></p></div>`).join('')}</div></section>
<section class="cv-document" aria-label="Full CV document"><div class="document-toolbar"><span><span class="status-dot" aria-hidden="true"></span>Curriculum vitae / PDF</span><a href="assets/cv.pdf" target="_blank" rel="noopener noreferrer">Open full screen <span aria-hidden="true">↗</span></a></div><object class="pdf-viewer" data="assets/cv.pdf#view=FitH" type="application/pdf" aria-label="Mohammad Amin Raeisi curriculum vitae"><div class="pdf-fallback"><p>Your browser can display the CV in a separate tab.</p><a class="button" href="assets/cv.pdf">View the PDF <span aria-hidden="true">↗</span></a></div></object></section><p class="document-note">Prefer a separate window? <a href="assets/cv.pdf" target="_blank" rel="noopener noreferrer">Open the CV as a PDF</a>.</p>`;

const misc = `<section class="page-intro"><p class="eyebrow">Teaching, community & other things</p><h1>Beyond the papers<span class="accent">.</span></h1><p>A few other parts of my academic life.</p></section>
<section class="section split-section first-section" aria-labelledby="teaching-title"><div class="section-label"><span class="section-number">01</span><h2 id="teaching-title">Teaching</h2></div><div class="timeline">${site.teaching.map(t=>`<article class="timeline-entry"><div class="timeline-head"><h3>${esc(t.institution)}</h3>${t.dates ? `<span>${esc(t.dates)}</span>` : ''}</div><p class="timeline-role">${esc(t.role)}</p><p>${esc(t.text)}</p></article>`).join('')}</div></section>
<section class="section split-section" aria-labelledby="service-title"><div class="section-label"><span class="section-number">02</span><h2 id="service-title">Community & service</h2></div><div class="prose">${site.service.map(s=>`<article><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div></section>
<section class="section split-section" aria-labelledby="elsewhere-title"><div class="section-label"><span class="section-number">03</span><h2 id="elsewhere-title">A few more things</h2></div><div class="prose">${site.misc.map(m=>`<article><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p>${m.link ? external(m.link,esc(m.linkLabel),'text-link') : ''}</article>`).join('')}</div></section>`;

for (const [file, page, title, content] of [['index.html','about','About',intro],['publications.html','publications','Publications',pub],['cv.html','cv','CV',cv],['misc.html','misc','Misc',misc]]) await writeFile(path.join(root,file),layout(page,title,content));
await mkdir(path.join(root,'assets/bib'),{recursive:true});
function bib(p) {
  if (p.bibtex) return p.bibtex.trim() + '\n';
  return `@article{${p.id.replace(/-/g,'')}${p.year},\n  title = {${p.title}},\n  author = {${(Array.isArray(p.authors)?p.authors:[p.authors]).map(n=>n.replace(/\*/g,'')).join(' and ')}},\n  year = {${p.year}},\n  url = {${p.paperUrl}}\n}\n`;
}
for(const p of papers) await writeFile(path.join(root,`assets/bib/${p.id}.bib`),bib(p));
await writeFile(path.join(root,'assets/publications.bib'),papers.map(bib).join('\n'));
console.log(`Built 4 pages and ${papers.length} bibliography entries.`);
