import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import container from "markdown-it-container";
import hljs from "highlight.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const SITE_FONTS = path.join(ROOT, "assets/fonts");
const FAVICON = path.join(ROOT, "assets/favicon.svg");

const slugify = (s) =>
  String(s).trim().toLowerCase()
    .replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").replace(/\-+/g, "-");

const CLIENT_JS = String.raw`(function(){
  var doc=document.documentElement;
  // theme
  var tb=document.getElementById('themeToggle');
  if(tb) tb.addEventListener('click',function(){var n=doc.getAttribute('data-theme')==='light'?'dark':'light';doc.setAttribute('data-theme',n);try{localStorage.setItem('skans-theme',n)}catch(e){}});
  // mobile sidebar
  var side=document.getElementById('side'),scrim=document.getElementById('scrim'),st=document.getElementById('sideToggle');
  function closeSide(){side&&side.classList.remove('open');scrim&&scrim.classList.remove('open');}
  if(st) st.addEventListener('click',function(){side.classList.toggle('open');scrim.classList.toggle('open');});
  if(scrim) scrim.addEventListener('click',closeSide);
  // copy buttons
  document.querySelectorAll('.code-copy').forEach(function(btn){
    btn.addEventListener('click',function(){
      var pre=btn.closest('.code-block').querySelector('pre');
      navigator.clipboard.writeText(pre.innerText).then(function(){
        btn.classList.add('copied');var s=btn.querySelector('span');var o=s.textContent;s.textContent='Copied';
        setTimeout(function(){btn.classList.remove('copied');s.textContent=o;},1400);
      });
    });
  });
  // image zoom
  document.querySelectorAll('.prose img').forEach(function(img){
    img.addEventListener('click',function(){
      var o=document.createElement('div');o.className='imgzoom';o.style.cssText='position:fixed;inset:0;z-index:120;background:rgba(4,7,12,.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:5vh';
      var big=img.cloneNode();big.style.cssText='max-width:92vw;max-height:90vh;border-radius:12px;cursor:zoom-out';o.appendChild(big);
      o.addEventListener('click',function(){o.remove()});document.body.appendChild(o);
    });
  });
  // TOC scrollspy
  var links=[].slice.call(document.querySelectorAll('.toc a'));
  if(links.length){
    var map={};links.forEach(function(a){map[a.dataset.id]=a;});
    var obs=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('active')});var a=map[e.target.id];if(a)a.classList.add('active');}});
    },{rootMargin:'-70px 0px -70% 0px'});
    document.querySelectorAll('.prose h2[id],.prose h3[id]').forEach(function(h){obs.observe(h);});
  }
  // search
  var modal,input,results,idx=null,sel=-1;
  function build(){
    modal=document.createElement('div');modal.className='search-modal';
    modal.innerHTML='<div class="search-box"><div class="search-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/></svg><input type="text" placeholder="Search the docs…" autocomplete="off" spellcheck="false"></div><div class="search-results"></div></div>';
    document.body.appendChild(modal);
    input=modal.querySelector('input');results=modal.querySelector('.search-results');
    modal.addEventListener('click',function(e){if(e.target===modal)close();});
    input.addEventListener('input',run);
    input.addEventListener('keydown',function(e){
      var items=[].slice.call(results.querySelectorAll('.sr-item'));
      if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,items.length-1);}
      else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);}
      else if(e.key==='Enter'){if(items[sel])location.href=items[sel].getAttribute('href');return;}
      else return;
      items.forEach(function(it,i){it.classList.toggle('sel',i===sel);});
      if(items[sel])items[sel].scrollIntoView({block:'nearest'});
    });
  }
  function open(){if(!modal)build();modal.classList.add('open');input.value='';results.innerHTML='';sel=-1;input.focus();
    if(idx===null)fetch('/search-index.json').then(function(r){return r.json()}).then(function(d){idx=d;});}
  function close(){modal&&modal.classList.remove('open');}
  function esc(s){return s.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});}
  function run(){
    var q=input.value.trim().toLowerCase();sel=-1;
    if(!q||!idx){results.innerHTML='';return;}
    var out=[];
    for(var i=0;i<idx.length&&out.length<8;i++){
      var d=idx[i];var hay=(d.title+' '+d.body).toLowerCase();var p=hay.indexOf(q);
      if(p<0)continue;
      var bl=d.body.toLowerCase().indexOf(q);var snip=bl<0?d.body.slice(0,120):d.body.slice(Math.max(0,bl-40),bl+80);
      snip=esc(snip).replace(new RegExp('('+q.replace(/[-.*+?^()|[\]\\{}$]/g,'\\$&')+')','ig'),'<mark>$1</mark>');
      out.push('<a class="sr-item" href="'+d.url+'"><div class="sr-crumb">'+esc(d.group)+'</div><div class="sr-title">'+esc(d.title)+'</div><div class="sr-snip">…'+snip+'…</div></a>');
    }
    results.innerHTML=out.join('');
  }
  // blog category filter
  var grid=document.getElementById('blogGrid');
  if(grid){
    document.querySelectorAll('.fchip').forEach(function(ch){
      ch.addEventListener('click',function(){
        document.querySelectorAll('.fchip').forEach(function(x){x.classList.remove('on');});
        ch.classList.add('on');var f=ch.dataset.filter;
        grid.querySelectorAll('.post-card').forEach(function(c){c.style.display=(f==='all'||c.dataset.cat===f)?'':'none';});
      });
    });
  }
  var so=document.getElementById('searchOpen');if(so)so.addEventListener('click',open);
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}
    if(e.key==='Escape')close();
  });
})();`;

/* ---------- markdown-it ---------- */
const md = new MarkdownIt({
  html: true, linkify: true, typographer: true,
  highlight(code, lang) {
    let out;
    try { out = lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value; }
    catch { out = md.utils.escapeHtml(code); }
    const label = (lang || "text").toUpperCase();
    const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>`;
    return `<div class="code-block"><div class="code-head"><span class="code-dot"></span><span class="code-lang">${label}</span>`
      + `<button class="code-copy" type="button" aria-label="Copy code">${copyIcon}<span>Copy</span></button></div>`
      + `<pre><code class="hljs language-${lang || "text"}">${out}</code></pre></div>`;
  },
});
md.use(anchor, {
  slugify,
  permalink: anchor.permalink.linkInsideHeader({ symbol: "#", placement: "after", class: "anchor" }),
  level: [2, 3],
});
const callout = (name, title, icon) =>
  md.use(container, name, {
    render(tokens, idx) {
      if (tokens[idx].nesting === 1)
        return `<div class="callout callout-${name}"><div class="callout-title">${icon}<span>${title}</span></div>\n`;
      return `</div>\n`;
    },
  });
const IC = {
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`,
  tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.2-1 2.5H9c0-1.3-.3-1.8-1-2.5A6 6 0 0 1 12 3z"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
};
callout("note", "Note", IC.note);
callout("tip", "Tip", IC.tip);
callout("warning", "Warning", IC.warning);

// images -> figure with caption (from title text)
md.renderer.rules.image = (tokens, idx, opts, env, self) => {
  const t = tokens[idx];
  const title = t.attrGet("title");
  if (title) t.attrSet("title", "");
  const img = self.renderToken(tokens, idx, opts);
  return title ? `<figure>${img}<figcaption>${md.utils.escapeHtml(title)}</figcaption></figure>` : img;
};

/* ---------- TOC extraction ---------- */
function extractToc(mdText) {
  const toc = [];
  for (const tok of md.parse(mdText, {})) {
    if (tok.type === "heading_open" && (tok.tag === "h2" || tok.tag === "h3")) {
      const inline = md.parse(mdText, {}); // cheap; we grab text below
    }
  }
  // simpler: regex ATX headings (## / ###) not inside code fences
  const lines = mdText.split("\n"); let fence = false;
  for (const ln of lines) {
    if (/^\s*(```|~~~)/.test(ln)) { fence = !fence; continue; }
    if (fence) continue;
    const m = /^(#{2,3})\s+(.*?)\s*#*\s*$/.exec(ln);
    if (m) toc.push({ level: m[1].length, text: m[2].replace(/[*`_]/g, ""), id: slugify(m[2].replace(/[*`_]/g, "")) });
  }
  return toc;
}

/* ---------- data ---------- */
const versions = JSON.parse(fs.readFileSync(path.join(CONTENT, "versions.json"), "utf8"));
const latest = versions.versions.find((v) => v.latest) || versions.versions[0];
const PRODUCT = versions.productName || "Skans";
const REPO = versions.repo || "#";

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="ax" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d3c1"/><stop offset=".55" stop-color="#38bdf8"/><stop offset="1" stop-color="#8b8cf6"/></linearGradient></defs>
<symbol id="m-shield" viewBox="0 0 48 56"><path d="M24 5 L40 9.6 C40.6 9.8 41 10.4 41 11 V27 C41 38.8 34 46.4 24 50.2 C14 46.4 7 38.8 7 27 V11 C7 10.4 7.4 9.8 8 9.6 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M29.6 14.5 L18.4 22.8 L29.6 30.4 L18.4 38.6" fill="none" stroke="url(#ax)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 44 L19 37 L23.5 41 L28.5 36 L36.5 44" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity=".8"/></symbol>
<symbol id="m-peak" viewBox="0 0 100 100"><path d="M11 90 L50 12" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 12 L89 90" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="M29 64 H71" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="12" r="5.5" fill="#34d3c1"/></symbol>
<symbol id="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></symbol>
<symbol id="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.4A8.2 8.2 0 1 1 9.6 4 6.4 6.4 0 0 0 20 14.4z"/></symbol>
<symbol id="ic-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
<symbol id="ic-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="ic-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></symbol>
<symbol id="ic-gh" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></symbol>
</svg>`;

const HEAD = (title, desc, depthPrefix) => `<!DOCTYPE html><html lang="en" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${PRODUCT} Docs</title>
<meta name="description" content="${md.utils.escapeHtml(desc || "")}">
<meta name="theme-color" content="#0a0d12">
<script>(function(){try{var t=localStorage.getItem('skans-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
</head><body>`;

function versionMenu(curVer, slug) {
  const rows = versions.versions.map((v) => {
    const href = `/${v.id}/${slug}/`;
    return `<a href="${href}" class="${v.id === curVer ? "cur" : ""}">v${v.id}${v.latest ? `<span class="ver-badge">latest</span>` : ""}</a>`;
  }).join("");
  const cur = versions.versions.find((v) => v.id === curVer);
  return `<details class="verswitch"><summary>v${curVer}${cur?.latest ? "" : ""}<svg class="caret" viewBox="0 0 24 24"><use href="#ic-caret"/></svg></summary><div class="verswitch-menu">${rows}</div></details>`;
}

function topbar({ active = "docs", ver = "", side = false } = {}) {
  return `<header class="dh"><div class="dh-inner">
${side ? `<button class="icon-btn side-toggle" id="sideToggle" aria-label="Open navigation"><svg viewBox="0 0 24 24"><use href="#ic-menu"/></svg></button>` : ""}
<a class="dh-brand" href="/"><svg class="brand-mark" viewBox="0 0 48 56"><use href="#m-shield"/></svg><span class="dh-word">SK<svg class="peak" viewBox="0 0 100 100"><use href="#m-peak"/></svg>NS</span></a>
<nav class="dh-nav"><a href="/" class="${active === "docs" ? "on" : ""}">Docs</a><a href="/blog/" class="${active === "blog" ? "on" : ""}">Blog</a></nav>
<div class="dh-spacer"></div>
<button class="searchbtn" id="searchOpen"><svg viewBox="0 0 24 24"><use href="#ic-search"/></svg><span>Search docs</span><span class="kbd">⌘K</span></button>
${ver}
<a class="icon-btn" href="https://skanslabs.com" aria-label="skanslabs.com" title="Main site"><svg viewBox="0 0 48 56"><use href="#m-shield"/></svg></a>
<a class="icon-btn" href="${REPO}" aria-label="GitHub"><svg viewBox="0 0 24 24"><use href="#ic-gh"/></svg></a>
<button class="theme-toggle icon-btn" id="themeToggle" aria-label="Toggle theme"><svg class="ic-sun" viewBox="0 0 24 24"><use href="#ic-sun"/></svg><svg class="ic-moon" viewBox="0 0 24 24"><use href="#ic-moon"/></svg></button>
</div></header>`;
}

function sidebar(nav, curVer, activeSlug) {
  const groups = nav.map((g) => {
    const items = g.items.map((it) =>
      `<a class="side-link ${it.slug === activeSlug ? "active" : ""}" href="/${curVer}/${it.slug}/">${it.title}</a>`
    ).join("");
    return `<div class="side-group"><p class="side-group-t">${g.group}</p>${items}</div>`;
  }).join("");
  return `<aside class="side" id="side">${groups}</aside>`;
}

function tocHtml(toc) {
  if (!toc.length) return `<nav class="toc"></nav>`;
  const items = toc.map((h) => `<a href="#${h.id}" class="${h.level === 3 ? "lvl3" : ""}" data-id="${h.id}">${md.utils.escapeHtml(h.text)}</a>`).join("");
  return `<nav class="toc"><p class="toc-t">On this page</p>${items}</nav>`;
}

function flatten(nav) { return nav.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group }))); }

/* ---------- render everything ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const searchIndex = [];

for (const v of versions.versions) {
  const verDir = path.join(CONTENT, v.id);
  const nav = JSON.parse(fs.readFileSync(path.join(verDir, "nav.json"), "utf8"));
  const flat = flatten(nav);

  flat.forEach((item, i) => {
    const mdPath = path.join(verDir, item.slug + ".md");
    if (!fs.existsSync(mdPath)) { console.warn("  ! missing", mdPath); return; }
    const raw = fs.readFileSync(mdPath, "utf8");
    const { data: fm, content } = matter(raw);
    const bodyHtml = md.render(content);
    const toc = extractToc(content);
    const title = fm.title || item.title;
    const prev = flat[i - 1], next = flat[i + 1];

    const crumbs = `<div class="crumbs"><a href="/${v.id}/${flat[0].slug}/">${PRODUCT} Docs</a><span class="sep">/</span>${item.group}<span class="sep">/</span>${title}</div>`;
    const eyebrow = fm.eyebrow ? `<span class="doc-eyebrow">${fm.eyebrow}</span>` : "";
    const pn = `<nav class="prevnext">${prev ? `<a class="pn prev" href="/${v.id}/${prev.slug}/"><span class="pn-dir">← Previous</span><span class="pn-title">${prev.title}</span></a>` : "<span></span>"}${next ? `<a class="pn next" href="/${v.id}/${next.slug}/"><span class="pn-dir">Next →</span><span class="pn-title">${next.title}</span></a>` : "<span></span>"}</nav>`;

    const html = HEAD(title, fm.description) + SPRITE + topbar({ active: "docs", ver: versionMenu(v.id, item.slug), side: true })
      + `<div class="shell">` + sidebar(nav, v.id, item.slug)
      + `<main class="content"><article class="prose">${crumbs}${eyebrow}<h1>${title}</h1>${bodyHtml}${pn}</article></main>`
      + tocHtml(toc)
      + `</div><div class="scrim" id="scrim"></div><script src="/docs.js" defer></script></body></html>`;

    const outDir = path.join(DIST, v.id, item.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html);

    // search index (latest version only, to keep it lean)
    if (v.latest) {
      const plain = content.replace(/```[\s\S]*?```/g, " ").replace(/[#>*`_\-|]/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
      searchIndex.push({ title, group: item.group, url: `/${v.id}/${item.slug}/`, body: plain.slice(0, 1400) });
    }
  });
  console.log(`  built v${v.id} — ${flat.length} pages`);
}

/* ---------- blog (announcements + how-tos) ---------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtDate(s){ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||"")); return m?`${MONTHS[+m[2]-1]} ${+m[3]}, ${m[1]}`:String(s||""); }
const catClass = (c)=>"cat-"+slugify(c||"post");
const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 7l5 5-5 5"/></svg>`;
const BLOGDIR = path.join(CONTENT, "blog");
let posts = [];
if (fs.existsSync(BLOGDIR)) {
  posts = fs.readdirSync(BLOGDIR).filter((f)=>f.endsWith(".md")).map((f)=>{
    const { data: fm, content } = matter(fs.readFileSync(path.join(BLOGDIR, f), "utf8"));
    return { slug: f.replace(/\.md$/, ""), fm, content };
  }).sort((a,b)=>String(b.fm.date||"").localeCompare(String(a.fm.date||"")));
}
if (posts.length) {
  const cats = [...new Set(posts.map((p)=>p.fm.category).filter(Boolean))];
  const chips = `<button class="fchip on" data-filter="all">All</button>` + cats.map((c)=>`<button class="fchip" data-filter="${slugify(c)}">${c}</button>`).join("");
  const cards = posts.map((p)=>{
    const cat = p.fm.category || "Post";
    const cover = p.fm.cover ? `<img src="${p.fm.cover}" alt="">` : "";
    return `<a class="post-card" data-cat="${slugify(cat)}" href="/blog/${p.slug}/"><div class="post-cover">${cover}<span class="post-cat ${catClass(cat)}">${cat}</span></div><div class="post-body"><div class="post-meta">${fmtDate(p.fm.date)}${p.fm.author?` · ${md.utils.escapeHtml(p.fm.author)}`:""}</div><h3>${md.utils.escapeHtml(p.fm.title||p.slug)}</h3><p>${md.utils.escapeHtml(p.fm.excerpt||"")}</p><span class="post-more">Read post ${ARROW}</span></div></a>`;
  }).join("");
  const indexHtml = HEAD("Blog", "Announcements and how-tos from Skans Labs.") + SPRITE + topbar({ active: "blog" })
    + `<main class="blog-wrap"><div class="blog-hero"><span class="blog-eyebrow">Skans Labs</span><h1>Blog</h1><p>Product announcements, release notes, and hands-on how-tos.</p></div><div class="blog-filters">${chips}</div><div class="blog-grid" id="blogGrid">${cards}</div></main><script src="/docs.js" defer></script></body></html>`;
  fs.mkdirSync(path.join(DIST, "blog"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "blog", "index.html"), indexHtml);
  posts.forEach((p)=>{
    const cat = p.fm.category || "Post";
    const cover = p.fm.cover ? `<div class="post-hero-cover"><img src="${p.fm.cover}" alt=""></div>` : `<div class="post-hero-cover"></div>`;
    const html = HEAD(p.fm.title||p.slug, p.fm.excerpt) + SPRITE + topbar({ active: "blog" })
      + `<article class="post-article"><a class="post-back" href="/blog/">← All posts</a>${cover}<div class="post-head"><span class="post-cat ${catClass(cat)}">${cat}</span><h1>${md.utils.escapeHtml(p.fm.title||p.slug)}</h1><div class="post-byline">${p.fm.author?`<b>${md.utils.escapeHtml(p.fm.author)}</b><span class="dot"></span>`:""}${fmtDate(p.fm.date)}</div></div><div class="prose">${md.render(p.content)}</div></article><script src="/docs.js" defer></script></body></html>`;
    fs.mkdirSync(path.join(DIST, "blog", p.slug), { recursive: true });
    fs.writeFileSync(path.join(DIST, "blog", p.slug, "index.html"), html);
  });
  console.log(`  built blog — ${posts.length} posts`);
}

/* root redirect -> latest intro */
const firstNav = JSON.parse(fs.readFileSync(path.join(CONTENT, latest.id, "nav.json"), "utf8"));
const firstSlug = flatten(firstNav)[0].slug;
const home = `/${latest.id}/${firstSlug}/`;
fs.writeFileSync(path.join(DIST, "index.html"),
  `<!DOCTYPE html><meta charset="utf-8"><title>${PRODUCT} Docs</title><meta http-equiv="refresh" content="0; url=${home}"><link rel="canonical" href="${home}"><script>location.replace(${JSON.stringify(home)})</script><a href="${home}">${PRODUCT} Documentation →</a>`);

fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(searchIndex));

/* assets */
fs.mkdirSync(path.join(DIST, "fonts"), { recursive: true });
for (const f of fs.readdirSync(SITE_FONTS)) fs.copyFileSync(path.join(SITE_FONTS, f), path.join(DIST, "fonts", f));
fs.copyFileSync(FAVICON, path.join(DIST, "favicon.svg"));
fs.writeFileSync(path.join(DIST, "docs.js"), CLIENT_JS);
// CMS admin portal (Sveltia) — copy admin/ -> dist/admin
const ADMIN = path.join(ROOT, "admin");
if (fs.existsSync(ADMIN)) {
  fs.mkdirSync(path.join(DIST, "admin"), { recursive: true });
  for (const f of fs.readdirSync(ADMIN)) fs.copyFileSync(path.join(ADMIN, f), path.join(DIST, "admin", f));
  console.log("  admin portal copied → /admin");
}
// CMS-uploaded media (images, covers) — copy content/media -> dist/media
const MEDIA = path.join(CONTENT, "media");
if (fs.existsSync(MEDIA)) {
  fs.cpSync(MEDIA, path.join(DIST, "media"), { recursive: true });
  console.log("  media copied → /media");
}
console.log("  assets copied · search index:", searchIndex.length, "docs · home:", home);
