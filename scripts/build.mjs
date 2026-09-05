import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'docs');
const readJSON = async name => JSON.parse(await readFile(path.join(root, 'content', name), 'utf8'));
const [profile, papers, work] = await Promise.all(['profile.json', 'papers.json', 'work-in-progress.json'].map(readJSON));
const origin = (process.env.SITE_URL || 'https://diamondr.github.io/rebecca-diamond').replace(/\/$/, '');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const authors = values => values.length < 2 ? values.join('') : values.length === 2 ? values.join(' and ') : values.slice(0, -1).join(', ') + ', and ' + values.at(-1);
const sections = ['Working papers', 'Published papers', 'Work in progress'];
const slug = s => s.toLowerCase().replaceAll(' ', '-');
const cvLink = profile.localCv ? 'files/rebecca-diamond-cv.pdf' : profile.cv;

function page({ title, description, route = '', prefix = './', active = '', body, scripts = '', metadata = '' }) {
  const nav = [['Home', prefix], ['Research', prefix + 'research/'], ['CV', prefix + 'cv/'], ['Contact', prefix + '#contact']];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fbfaf7"><link rel="canonical" href="${esc(origin + '/' + route)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin + '/' + route)}">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${prefix}assets/style.css">${metadata}
</head>
<body><a class="skip-link" href="#main">Skip to content</a>
<div class="container"><header class="site-header"><a class="wordmark" href="${prefix}">Rebecca Diamond</a><nav class="site-nav" aria-label="Main navigation">${nav.map(([name, href]) => `<a href="${href}"${active === name ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav></header>
<main id="main">${body}</main>
<footer class="site-footer"><span>Rebecca Diamond · Harvard University</span><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></footer></div>${scripts}
</body></html>\n`;
}

function paperCard(p, prefix, home = false) {
  const title = esc(p.title);
  const detail = prefix + 'research/' + p.slug + '/';
  const searchable = [p.title, 'Rebecca Diamond', ...(p.coauthors || []), p.year, p.status, ...(p.topics || []), p.abstract].join(' ');
  return `<article class="paper" id="${esc(p.slug)}" data-paper data-search="${esc(searchable)}" data-topics="${esc((p.topics || []).join('|'))}">
  ${home ? `<div class="paper-meta"><span class="paper-year">${p.year}</span><span>Working paper</span></div>` : ''}
  <div><h3><a href="${detail}">${title}</a></h3>
  ${p.coauthors?.length ? `<p class="coauthors">With ${esc(authors(p.coauthors))}</p>` : ''}
  <p class="paper-status">${[p.status, p.date ? `Draft: ${p.date}` : ''].filter(Boolean).map(esc).join(' · ')}</p>
  <div class="paper-links"><a href="${esc(p.pdf)}" aria-label="Read paper: ${title}">Paper${p.directPdf ? ' (PDF)' : ''}</a><a href="${detail}" aria-label="Details for ${title}">Details</a></div>
  ${p.abstract && !home ? `<details class="paper-abstract"><summary>Abstract</summary><p>${esc(p.abstract)}</p></details>` : ''}</div></article>`;
}

async function save(name, html) { const dest = path.join(output, name); await mkdir(path.dirname(dest), { recursive: true }); await writeFile(dest, html); }
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
const contact = `<section id="contact" class="contact-section" aria-labelledby="contact-heading"><div><h2 id="contact-heading">Contact</h2><p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a><br>${esc(profile.department)}, ${esc(profile.institution)}<br>${esc(profile.office)}</p></div><div><h2>Conference</h2><p><a href="${esc(profile.conference)}">Cities, Housing, and Society</a><br>August 27, 2026 · Cambridge, MA<br>Program and conference information</p></div></section>`;
await save('index.html', page({title:'Rebecca Diamond | Harvard University', description:`${profile.title}, ${profile.institution}. Research in housing, cities, labor markets, and economic inequality.`, active:'Home', body:`
<section class="intro" aria-labelledby="name"><div class="intro-copy"><p class="eyebrow">Department of Economics</p><h1 id="name">Rebecca Diamond</h1><p class="role">${esc(profile.title)}</p><p class="affiliation">${esc(profile.institution)}</p><p class="intro-bio">${esc(profile.bio)}</p><div class="intro-links"><a href="./research/">Research</a><a href="./cv/">Curriculum vitae</a><a href="mailto:${esc(profile.email)}">Email</a></div></div><img class="portrait" src="./assets/rebecca-diamond.jpg" alt="Rebecca Diamond" width="200" height="240" fetchpriority="high"></section>
<section class="home-papers" aria-labelledby="recent-heading"><div class="section-heading"><h2 id="recent-heading">Recent research</h2><a href="./research/">All research <span aria-hidden="true">→</span></a></div>${papers.filter(p => p.recent).map(p => paperCard(p, './', true)).join('')}</section>${contact}`,
metadata:`<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'Person',name:profile.name,url:origin+'/',jobTitle:profile.title,affiliation:{'@type':'Organization',name:profile.institution},image:origin+'/assets/rebecca-diamond.jpg',email:profile.email})}</script>`}));

const topics = [...new Set(papers.flatMap(p => p.topics))].sort();
const wip = work.map((p, i) => `<article class="paper" id="work-${i}" data-paper data-search="${esc([p.title,...p.coauthors,'Rebecca Diamond'].join(' '))}" data-topics=""><h3>${esc(p.title)}</h3><p class="coauthors">With ${esc(authors(p.coauthors))}</p>${p.note ? `<p class="paper-status">${esc(p.note)}${p.pdf ? ` <a href="${esc(p.pdf)}">Original paper</a>` : ''}</p>` : ''}</article>`).join('');
await save('research/index.html', page({title:'Research | Rebecca Diamond',description:'Working papers, published papers, and work in progress by Rebecca Diamond.',route:'research/',prefix:'../',active:'Research',body:`
<div class="page-heading"><h1>Research</h1></div>
<div class="search-tools js-only"><div class="field"><label for="paper-search">Search papers</label><input id="paper-search" type="search" placeholder="Title, coauthor, or keyword" autocomplete="off"></div><div class="field"><label for="topic-filter">Topic</label><select id="topic-filter"><option value="">All topics</option>${topics.map(t => `<option>${esc(t)}</option>`).join('')}</select></div></div>
<p class="search-summary" id="search-count" role="status" aria-live="polite"></p>
<div class="research-layout"><aside class="research-sidebar"><nav aria-label="Research sections">${sections.map(s => `<a href="#${slug(s)}">${s}</a>`).join('')}</nav></aside><div>${sections.map(s => `<section class="research-group" id="${slug(s)}" aria-labelledby="${slug(s)}-heading"><h2 id="${slug(s)}-heading">${s}</h2>${s === 'Work in progress' ? wip : papers.filter(p => p.category === s).map(p => paperCard(p, '../')).join('')}</section>`).join('')}<div id="no-results" class="no-results" hidden><h2>No matching papers</h2><p>Try another title, coauthor, or topic.</p><button class="text-button" id="clear-search" type="button">Clear search and filters</button></div></div></div>`,scripts:'<script src="../assets/research.js" defer></script>'}));

await save('cv/index.html',page({title:'Curriculum vitae | Rebecca Diamond',description:'Curriculum vitae and contact information for Rebecca Diamond, Harvard University.',route:'cv/',prefix:'../',active:'CV',body:`<div class="page-heading"><h1>Curriculum vitae</h1></div><div class="narrow"><p>${esc(profile.name)}<br>${esc(profile.title)}<br>${esc(profile.department)}, ${esc(profile.institution)}</p><a class="cv-link" href="${esc(cvLink)}">View curriculum vitae (PDF) <span aria-hidden="true">&nbsp;↗</span></a><p>For questions, please email <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>.</p></div>`}));

for (const p of papers) {
  const detailAuthors = p.authors || (p.coauthors.length === 0 ? ['Rebecca Diamond'] : []);
  const metadata = `<meta name="citation_title" content="${esc(p.title)}">${detailAuthors.map(a => `<meta name="citation_author" content="${esc(a)}">`).join('')}<meta name="citation_publication_date" content="${p.year}">${p.directPdf ? `<meta name="citation_pdf_url" content="${esc(p.pdf)}">` : ''}`;
  await save(`research/${p.slug}/index.html`,page({title:p.title+' | Rebecca Diamond',description:p.abstract || `${p.title}. ${p.coauthors.length ? 'With '+authors(p.coauthors)+'. ' : ''}${p.status || 'Working paper'}, ${p.year}.`,route:`research/${p.slug}/`,prefix:'../../',active:'Research',metadata,body:`<article class="paper-detail"><a class="back-link" href="../#${p.slug}">← All research</a><p class="eyebrow">${p.category === 'Working papers' ? 'Working paper' : 'Published paper'} · ${p.year}</p><h1>${esc(p.title)}</h1>${p.coauthors.length ? `<p class="coauthors">With ${esc(authors(p.coauthors))}</p>` : ''}<p class="paper-status">${[p.status,p.date ? 'Draft: '+p.date : ''].filter(Boolean).map(esc).join('<br>')}</p><div class="paper-links"><a href="${esc(p.pdf)}">Read paper${p.directPdf ? ' (PDF)' : ''} <span aria-hidden="true">↗</span></a>${p.citation ? `<a href="./citation.bib" download>Download citation (BibTeX)</a>` : ''}</div>${p.abstract ? `<section><h2>Abstract</h2><p class="abstract-text">${esc(p.abstract)}</p>${p.abstractSource ? `<p class="paper-status">${p.abstractLabel ? esc(p.abstractLabel)+' · ' : ''}<a href="${esc(p.abstractSource)}">Source</a></p>` : ''}</section>` : ''}<p class="topics">${p.topics.map(t => `<a href="../?topic=${encodeURIComponent(t)}">${esc(t)}</a>`).join(' · ')}</p></article>`}));
  if(p.citation) await save(`research/${p.slug}/citation.bib`,p.citation+'\n');
}
await save('home/index.html',page({title:'Rebecca Diamond | Harvard University',description:'Rebecca Diamond, Harvard University.',route:'',prefix:'../',body:'<p class="page-heading"><a href="../">Continue to the homepage</a></p>',metadata:'<meta http-equiv="refresh" content="0;url=../">'}));
await save('404.html',page({title:'Page not found | Rebecca Diamond',description:'This page could not be found.',prefix:origin+'/',body:'<div class="page-heading empty-space"><h1>Page not found</h1><p>The page may have moved. <a href="'+origin+'/">Return to the homepage</a> or <a href="'+origin+'/research/">browse the research</a>.</p></div>'}));
await save('.nojekyll','');
await save('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await save('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','research/','cv/',...papers.map(p => `research/${p.slug}/`)].map(route => `<url><loc>${esc(origin+'/'+route)}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${papers.length} paper pages, home, research, and CV in docs/.`);
