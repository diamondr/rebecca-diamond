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
const resource = (prefix, url) => /^(?:https?:|mailto:)/.test(url) ? url : prefix + url;

function page({ title, description, route = '', prefix = './', home = false, body, scripts = '', metadata = '' }) {
  const nav = home
    ? [['Research', prefix + 'research/'], ['CV', resource(prefix, profile.cv)]]
    : [['Home', prefix], ['CV', resource(prefix, profile.cv)], ['Email', 'mailto:' + profile.email]];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fffefa"><link rel="canonical" href="${esc(origin + '/' + route)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(origin + '/' + route)}">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${prefix}assets/fonts/newsreader-regular.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="${prefix}assets/style.css">${metadata}
</head>
<body><a class="skip-link" href="#main">Skip to content</a>
<div class="container"><header class="site-header">${home ? '<div class="institution-mark">Harvard University<span>/</span><em style="font-style:normal">Economics</em></div>' : `<a class="wordmark" href="${prefix}">Rebecca Diamond</a>`}<nav class="site-nav" aria-label="Main navigation">${nav.map(([name, href]) => `<a href="${esc(href)}"${name === 'CV' ? ' aria-label="Curriculum vitae (PDF)"' : ''}>${name}</a>`).join('')}</nav></header>
<main id="main">${body}</main>
<footer class="site-footer">${home ? `<p><a href="${esc(profile.conference)}">Cities, Housing, and Society conference</a><span class="conference-date">August 27, 2026</span></p>` : `<p>${esc(profile.department)} · ${esc(profile.institution)}</p>`}<p>${esc(profile.office)}</p></footer></div>${scripts}
</body></html>\n`;
}

function paperCard(p, prefix, home = false) {
  const searchable = [p.title, 'Rebecca Diamond', ...(p.coauthors || []), p.year, p.status, ...(p.topics || []), p.abstract].join(' ');
  return `<article class="paper" id="${esc(p.slug)}" data-paper data-search="${esc(searchable)}" data-topics="${esc((p.topics || []).join('|'))}">
  <div class="paper-date">${esc(p.date || p.year)}</div>
  <div class="paper-content"><h3><a href="${esc(resource(prefix, p.pdf))}" aria-label="Read paper: ${esc(p.title)}">${esc(p.title)}<span class="pdf-label" aria-hidden="true">PDF ↗</span></a></h3>
  ${p.coauthors?.length ? `<p class="coauthors">With ${esc(authors(p.coauthors))}</p>` : ''}
  ${p.status ? `<p class="paper-status">${esc(p.status)}</p>` : ''}
  ${p.abstract ? `<details class="paper-abstract"><summary>Abstract<span class="sr-only">: ${esc(p.title)}</span></summary><div class="abstract-body"><p>${esc(p.abstract)}</p><p class="abstract-source">${p.abstractLabel ? `<span>${esc(p.abstractLabel)}</span>` : ''}${p.abstractSource ? `<a href="${esc(p.abstractSource)}">${p.abstractSource.includes('nber.org') ? 'NBER' : 'Opportunity Insights'}</a>` : ''}${p.citation ? `<a href="${prefix}citations/${esc(p.slug)}.bib" download aria-label="Download BibTeX citation for ${esc(p.title)}">BibTeX</a>` : ''}</p></div></details>` : ''}</div></article>`;
}

async function save(name, html) { const dest = path.join(output, name); await mkdir(path.dirname(dest), { recursive: true }); await writeFile(dest, html); }
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'files'), path.join(output, 'files'), { recursive: true });
await save('index.html', page({ title:'Rebecca Diamond | Harvard University', description:`${profile.title}, ${profile.institution}. Research in housing, cities, labor markets, and economic inequality.`, home:true, body:`
<div class="home-layout"><section class="profile" aria-labelledby="name"><img class="portrait" src="./assets/rebecca-diamond.jpg" alt="Rebecca Diamond" width="144" height="166" fetchpriority="high"><h1 id="name">Rebecca Diamond</h1><p class="role">${esc(profile.title)}</p><p class="intro-bio">${esc(profile.bio)}</p><address class="contact" id="contact"><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></address></section>
<section class="home-papers" aria-labelledby="recent-heading"><div class="section-heading"><h2 id="recent-heading">Recent research</h2></div>${papers.filter(p => p.recent).map(p => paperCard(p, './', true)).join('')}<p class="all-research"><a href="./research/">View all research <span aria-hidden="true">→</span></a></p></section></div>`,
metadata:`<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'Person',name:profile.name,url:origin+'/',jobTitle:profile.title,affiliation:{'@type':'Organization',name:profile.institution},image:origin+'/assets/rebecca-diamond.jpg',email:profile.email})}</script>` }));

const topics = [...new Set(papers.flatMap(p => p.topics))].sort();
const wip = work.map((p, i) => `<article class="paper" id="work-${i}" data-paper data-search="${esc([p.title,...p.coauthors,'Rebecca Diamond'].join(' '))}" data-topics=""><div class="paper-date" aria-hidden="true"></div><div class="paper-content"><h3>${esc(p.title)}</h3><p class="coauthors">With ${esc(authors(p.coauthors))}</p>${p.note ? `<p class="paper-status">${esc(p.note)}${p.pdf ? ` <a href="${esc(resource('../', p.pdf))}">Original paper</a>` : ''}</p>` : ''}</div></article>`).join('');
await save('research/index.html', page({title:'Research | Rebecca Diamond',description:'Working papers, published papers, and work in progress by Rebecca Diamond.',route:'research/',prefix:'../',body:`
<div class="research-index"><div class="page-heading"><h1>Research</h1></div>
<nav class="research-sidebar" aria-label="Research sections">${sections.map(s => `<a href="#${slug(s)}">${s}</a>`).join('')}</nav>
<div class="search-tools js-only"><div class="field"><label for="paper-search">Search papers</label><input id="paper-search" type="search" placeholder="Title, coauthor, or keyword" autocomplete="off"></div><div class="field"><label for="topic-filter">Topic</label><select id="topic-filter"><option value="">All topics</option>${topics.map(t => `<option>${esc(t)}</option>`).join('')}</select></div></div>
<p class="search-summary" id="search-count" role="status" aria-live="polite"></p>
${sections.map(s => `<section class="research-group" id="${slug(s)}" aria-labelledby="${slug(s)}-heading"><h2 id="${slug(s)}-heading">${s}</h2>${s === 'Work in progress' ? wip : papers.filter(p => p.category === s).map(p => paperCard(p, '../')).join('')}</section>`).join('')}<div id="no-results" class="no-results" hidden><h2>No matching papers</h2><p>Try another title, coauthor, or topic.</p><button class="text-button" id="clear-search" type="button">Clear search and filters</button></div></div>`,scripts:'<script src="../assets/research.js" defer></script>'}));

// Keep previously published URLs working without making them stops in navigation.
function redirect({title,target,prefix,route}) {
  return page({title:title+' | Rebecca Diamond',description:title,route,prefix,metadata:`<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${esc(target)}">`,body:`<div class="redirect-page"><h1>${esc(title)}</h1><p><a href="${esc(target)}">Continue <span aria-hidden="true">→</span></a></p></div>`});
}
for (const p of papers) {
  await save(`research/${p.slug}/index.html`,redirect({title:p.title,target:`../#${p.slug}`,prefix:'../../',route:`research/#${p.slug}`}));
  if(p.citation) {
    await save(`citations/${p.slug}.bib`,p.citation+'\n');
    await save(`research/${p.slug}/citation.bib`,p.citation+'\n');
  }
}
await save('cv/index.html',redirect({title:'Curriculum vitae',target:resource('../',profile.cv),prefix:'../',route:'cv/'}));
await save('home/index.html',redirect({title:'Rebecca Diamond',target:'../',prefix:'../',route:''}));
await save('404.html',page({title:'Page not found | Rebecca Diamond',description:'This page could not be found.',prefix:origin+'/',body:'<div class="redirect-page"><h1>Page not found</h1><p>The page may have moved. <a href="'+origin+'/">Return to the homepage</a> or <a href="'+origin+'/research/">browse the research</a>.</p></div>'}));
await save('.nojekyll','');
await save('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await save('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','research/'].map(route => `<url><loc>${esc(origin+'/'+route)}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built home and research, retaining ${papers.length} paper URL redirects and citation downloads.`);
