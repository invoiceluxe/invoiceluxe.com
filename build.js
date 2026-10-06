#!/usr/bin/env node
/* Invoice Luxe blog builder — zero dependencies, Node 18+.
   content/blog/*.md  ->  blog/<slug>/index.html, blog/index.html, blog/rss.xml,
   blog/latest.json, sitemap-blog.xml
   Only articles whose date <= today (Europe/Amsterdam) are published. */
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
const SRC = path.join(ROOT, 'content', 'blog');
const OUT = path.join(ROOT, 'blog');
const SITE = (process.env.SITE_URL || 'https://invoiceluxe.com').replace(/\/$/, '');
const BRAND = 'Invoice Luxe';
const TZ = 'Europe/Amsterdam';
const TOOLS = fs.existsSync(path.join(ROOT, 'tools.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'tools.json'), 'utf8')) : {};
const VIDEO = '/video/create-invoice/';
const hasVideo = fs.existsSync(path.join(ROOT, 'video', 'create-invoice', 'index.html'));
const today = process.env.BUILD_DATE || new Date().toLocaleDateString('en-CA', { timeZone: TZ });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
const plain = s => s.replace(/\*\*|`/g, '').replace(/\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const abs = u => /^https?:/.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u;

function parse(raw) {
  const m = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('missing front matter');
  const meta = {};
  m[1].split(/\r?\n/).forEach(l => {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  });
  return { meta, body: m[2] };
}

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
      `<a href="${u}"${/^https?:/.test(u) && !u.startsWith(SITE) ? ' rel="noopener" target="_blank"' : ''}>${t}</a>`);
}

function renderTable(rows) {
  const [h, ...b] = rows;
  return `<div class="tablewrap"><table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function md(body) {
  const lines = body.replace(/\r/g, '').split('\n');
  const html = [], toc = [], faq = [];
  let p = [], list = null, inFaq = false, curQ = null, curA = [], tbl = null;
  const flushP = () => { if (p.length) { const t = p.join(' '); html.push(`<p>${inline(t)}</p>`); if (inFaq && curQ) curA.push(plain(t)); p = []; } };
  const flushL = () => { if (list) { html.push(`<${list.t}>${list.i.map(x => `<li>${inline(x)}</li>`).join('')}</${list.t}>`); if (inFaq && curQ) curA.push(list.i.map(plain).join('; ')); list = null; } };
  const flushQ = () => { if (curQ && curA.length) faq.push({ q: plain(curQ), a: curA.join(' ') }); curQ = null; curA = []; };
  for (const raw of lines) {
    const l = raw.trimEnd(); let m;
    if (!l.trim()) { flushP(); flushL(); if (tbl) { html.push(renderTable(tbl)); tbl = null; } continue; }
    if (/^\|.*\|\s*$/.test(l)) {
      flushP(); flushL();
      tbl = tbl || [];
      if (!/^\|[\s:|-]+\|\s*$/.test(l)) tbl.push(l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      continue;
    }
    if (tbl) { html.push(renderTable(tbl)); tbl = null; }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { flushP(); flushL(); html.push(`<figure${/\/screen-/.test(m[2]) ? ' class="shot"' : ''}><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy" decoding="async"><figcaption>${esc(m[1])}</figcaption></figure>`); continue; }
    if ((m = l.match(/^(#{2,3})\s+(.*)$/))) {
      flushP(); flushL();
      const lv = m[1].length, t = m[2];
      if (lv === 2) { flushQ(); inFaq = /^(faq|frequently asked)/i.test(t); }
      else if (inFaq) { flushQ(); curQ = t; }
      const id = slugify(plain(t));
      if (lv === 2) toc.push({ id, t: plain(t) });
      html.push(`<h${lv} id="${id}">${inline(t)}</h${lv}>`); continue;
    }
    if ((m = l.match(/^[-*]\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', i: [] }; } list.i.push(m[1]); continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', i: [] }; } list.i.push(m[1]); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); html.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    flushL(); p.push(l.trim());
  }
  flushP(); flushL(); if (tbl) html.push(renderTable(tbl)); flushQ();
  return { html: html.join('\n'), faq, toc };
}

const CSS = `:root{--bg:#0d0c09;--panel:#16140e;--line:#2c2815;--text:#e9e5d8;--mute:#a39d86;--gold:#ffd23f;--gold2:#c99a00}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:18px/1.75 Georgia,'Iowan Old Style','Palatino Linotype',serif}
a{color:var(--gold);text-underline-offset:3px}a:hover{color:#fff}
.sans{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
header.site{border-bottom:1px solid var(--line)}
header.site div{max-width:980px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
header.site a.brand{font:800 18px system-ui,sans-serif;color:#fff;text-decoration:none;display:flex;align-items:center;gap:10px}
header.site a.brand i{width:28px;height:28px;border-radius:50%;background:var(--gold);color:#000;font:900 13px/28px system-ui;text-align:center;font-style:normal}
header.site nav{display:flex;gap:18px;font:600 15px system-ui,sans-serif}header.site nav a{color:var(--mute);text-decoration:none}header.site nav a:hover{color:var(--gold)}
main{max-width:720px;margin:0 auto;padding:44px 20px 70px}
.wide{max-width:980px}
h1{font:800 clamp(30px,5.4vw,46px)/1.12 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:-.02em;margin:0 0 14px;color:#fff}
h2{font:750 27px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:-.01em;margin:2.2em 0 .6em;color:#fff}
h3{font:700 20px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;margin:1.6em 0 .4em;color:var(--gold)}
p{margin:0 0 1.1em}ul,ol{padding-left:1.3em;margin:0 0 1.2em}li{margin:.35em 0}
blockquote{margin:1.4em 0;padding:.2em 1.1em;border-left:3px solid var(--gold);color:var(--mute)}
code{background:var(--panel);border:1px solid var(--line);padding:1px 6px;border-radius:5px;font-size:.88em}
.lead{font:400 20px/1.55 Georgia,serif;color:var(--mute);margin:0 0 18px}
.meta{font:500 14px system-ui,sans-serif;color:var(--mute);margin-bottom:34px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.cta{margin:2.4em 0;padding:22px 24px;border:1px solid var(--gold2);border-radius:14px;background:linear-gradient(135deg,#1d1900,#100f08)}
.cta b{display:block;font:800 20px system-ui,sans-serif;color:#fff;margin-bottom:6px}
.cta p{margin:0 0 14px;color:var(--mute);font:400 16px/1.55 system-ui,sans-serif}
.cta a.btn{display:inline-block;background:var(--gold);color:#000;font:800 16px system-ui,sans-serif;padding:11px 22px;border-radius:10px;text-decoration:none}
.cta a.btn:hover{background:#fff}
.more{margin-top:3em;padding-top:1.4em;border-top:1px solid var(--line)}
.more h2{margin-top:0;font-size:21px}.more li{font-family:system-ui,sans-serif;font-size:16px}
.cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));margin-top:30px}
.card{display:block;padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--panel);text-decoration:none;color:var(--text)}
.card:hover{border-color:var(--gold2)}
.card h2{font-size:20px;margin:0 0 8px}.card p{font:400 15px/1.55 system-ui,sans-serif;color:var(--mute);margin:0 0 10px}
.card small{font:500 13px system-ui,sans-serif;color:var(--mute)}
footer{border-top:1px solid var(--line);color:var(--mute);font:14px system-ui,sans-serif;text-align:center;padding:26px 20px}
a:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
figure{margin:1.8em 0}figure img{display:block;width:100%;height:auto;border-radius:12px;border:1px solid var(--line)}figcaption{font:13px/1.4 system-ui,sans-serif;color:var(--mute);margin-top:8px}
figure.cover{margin:0 0 30px}
figure.shot img{max-width:340px;margin:0 auto}figure.shot figcaption{text-align:center}
.tablewrap{overflow-x:auto;margin:1.4em 0;border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font:500 15px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
th{background:var(--panel);color:var(--gold);font-weight:700}
tr:last-child td{border-bottom:0}
.inline-cta{margin:1.6em 0;padding:14px 18px;border-left:3px solid var(--gold);background:var(--panel);font:400 16px/1.5 system-ui,sans-serif;border-radius:0 10px 10px 0}
.card img{display:block;width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover;border-radius:8px;margin-bottom:14px;border:1px solid var(--line)}
@media(max-width:560px){body{font-size:17px}h2{font-size:23px}}`;

const head = (title, desc, url, extra = '', img = '') => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-PQ41DBEN71"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-PQ41DBEN71');
</script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:site_name" content="${BRAND}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">${img ? `<meta property="og:image" content="${abs(img)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${abs(img)}">` : '<meta name="twitter:card" content="summary">'}
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#08080a">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>
<link rel="alternate" type="application/rss+xml" title="${BRAND} Guides" href="${SITE}/blog/rss.xml">
<style>${CSS}</style>${extra}</head><body>
<header class="site"><div><a class="brand" href="/"><i>IL</i>${BRAND}</a><nav><a href="/">Tools</a><a href="/blog/">Guides</a>${hasVideo ? `<a href="${VIDEO}">Video demo</a>` : ''}</nav></div></header>`;
const foot = `<footer>&copy; ${new Date().getFullYear()} ${BRAND}. Free invoicing tools for freelancers and small businesses.</footer></body></html>`;

function injectGuides(posts) {
  for (const [id, t] of Object.entries(TOOLS)) {
    const rel = t.url.split(/[?#]/)[0].replace(/^\//, '').replace(/\/$/, '');
    const cands = rel === '' ? ['index.html'] : [rel, rel + '.html', rel + '/index.html'];
    const file = cands.map(c => path.join(ROOT, c)).find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    if (!file) { console.warn(`- tool page not found for "${id}" (${t.url})`); continue; }
    const html = fs.readFileSync(file, 'utf8');
    const re = /<!--IL-GUIDES-->[\s\S]*?<!--\/IL-GUIDES-->/;
    if (!re.test(html)) { console.warn(`- marker missing in ${path.relative(ROOT, file)}: add <!--IL-GUIDES--><!--/IL-GUIDES-->`); continue; }
    const list = posts.filter(p => p.toolId === id).slice(0, 6);
    const box = list.length
      ? `<!--IL-GUIDES--><section style="max-width:760px;margin:28px auto;padding:18px 20px;border:1px solid #c99a00;border-radius:14px;background:#12100a;color:#e9e5d8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"><h2 style="margin:0 0 10px;font-size:18px;color:#ffd23f">Guides: ${esc(t.name)}</h2><ul style="margin:0;padding-left:18px;line-height:1.8;font-size:16px">${list.map(p => `<li><a href="/blog/${p.slug}/" style="color:#ffd23f">${esc(p.title)}</a></li>`).join('')}</ul></section><!--/IL-GUIDES-->`
      : '<!--IL-GUIDES--><!--/IL-GUIDES-->';
    fs.writeFileSync(file, html.replace(re, () => box));
  }
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => f.endsWith('.md') && !f.startsWith('_')) : [];
  const posts = [], future = [];
  for (const f of files) {
    try {
      const { meta, body } = parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
      const fm = f.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      const date = meta.date || (fm && fm[1]);
      const slug = slugify(meta.slug || (fm ? fm[2] : f.replace(/\.md$/, '')));
      if (!meta.title || !meta.description || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { console.warn(`! skipped ${f}: needs title, description and date (YYYY-MM-DD)`); continue; }
      if (/^(true|yes)$/i.test(meta.draft || '')) { console.warn(`- draft ${f}`); continue; }
      if (date > today) { future.push({ f, date }); continue; }
      const r = md(body);
      const words = body.split(/\s+/).filter(Boolean).length;
      posts.push({ ...meta, date, slug, url: `${SITE}/blog/${slug}/`, r, minutes: Math.max(1, Math.round(words / 220)) });
    } catch (e) { console.warn(`! skipped ${f}: ${e.message}`); }
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

  for (const p of posts) {
    const others = posts.filter(x => x !== p).slice(0, 3);
    const ld = [{
      '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description,
      datePublished: p.date, dateModified: p.updated || p.date, mainEntityOfPage: p.url,
      author: { '@type': 'Organization', name: BRAND, url: SITE },
      publisher: { '@type': 'Organization', name: BRAND, url: SITE },
      ...(p.image ? { image: abs(p.image) } : {})
    }];
    if (p.r.faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.r.faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
    if (p.toolId && !TOOLS[p.toolId]) console.warn(`! ${p.slug}: unknown toolId "${p.toolId}" (see tools.json)`);
    const t = (p.toolId && TOOLS[p.toolId]) || {};
    const toolName = p.tool || t.name || 'Free Invoice Generator';
    const toolUrl = p.toolUrl || t.url || '/';
    const toolBtn = p.ctaButton || t.button || 'Open the tool';
    const cta = `<aside class="cta"><b>${esc(toolName)}</b><p>${esc(p.ctaText || t.text || 'No signup needed. Your data stays on your device.')}</p><a class="btn" href="${esc(toolUrl)}">${esc(toolBtn)}</a></aside>`;
    const inlineCta = `<p class="inline-cta">Want to try it right away? <a href="${esc(toolUrl)}">${esc(toolName)}</a> is free and needs no signup.</p>`;
    const secs = p.r.html.split(/(?=<h2 )/);
    if (secs.length >= 4) secs.splice(2, 0, inlineCta);
    const bodyHtml = secs.join('\n');
    const cover = p.image ? `<figure class="cover"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" width="1200" height="630" decoding="async" fetchpriority="high"></figure>` : '';
    const page = head(`${p.title} | ${BRAND}`, p.description, p.url,
      `<script type="application/ld+json">${JSON.stringify(ld)}</script>`, p.image) +
`<main><article><h1>${esc(p.title)}</h1><p class="lead">${esc(p.description)}</p>
<div class="meta">${fmtDate(p.date)} &middot; ${p.minutes} min read</div>
${cover}
${bodyHtml}
${cta}</article>
${others.length ? `<section class="more"><h2>More guides</h2><ul>${others.map(o => `<li><a href="/blog/${o.slug}/">${esc(o.title)}</a></li>`).join('')}</ul></section>` : ''}
</main>` + foot;
    fs.mkdirSync(path.join(OUT, p.slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, p.slug, 'index.html'), page);
  }

  const idx = head(`Guides for freelancers and small businesses | ${BRAND}`,
    'Practical, step-by-step guides on invoicing, VAT, client management and getting paid on time.', `${SITE}/blog/`) +
`<main class="wide"><h1>Guides</h1><p class="lead">Practical guides on invoicing, VAT and getting paid on time.</p>
${posts.length ? `<div class="cards">${posts.map(p => `<a class="card" href="/blog/${p.slug}/">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" width="1200" height="630">` : ''}<h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><small>${fmtDate(p.date)} &middot; ${p.minutes} min read</small></a>`).join('')}</div>` : '<p>New guides are on the way. Check back soon.</p>'}
</main>` + foot;
  fs.writeFileSync(path.join(OUT, 'index.html'), idx);

  const rssItems = posts.slice(0, 30).map(p => `<item><title>${esc(p.title)}</title><link>${p.url}</link><guid>${p.url}</guid><pubDate>${new Date(p.date + 'T06:00:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('');
  fs.writeFileSync(path.join(OUT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${BRAND} Guides</title><link>${SITE}/blog/</link><description>Invoicing, VAT and freelancer guides</description><language>en</language>${rssItems}</channel></rss>`);
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(posts.slice(0, 10).map(p => ({ title: p.title, url: `/blog/${p.slug}/`, date: p.date, description: p.description }))));
  const urls = [{ loc: `${SITE}/blog/`, lm: posts[0] ? posts[0].date : today }, ...(hasVideo ? [{ loc: SITE + VIDEO, lm: today }] : []), ...posts.map(p => ({ loc: p.url, lm: p.updated || p.date }))];
  fs.writeFileSync(path.join(ROOT, 'sitemap-blog.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${u.lm}</lastmod></url>`).join('')}</urlset>`);

  injectGuides(posts);
  console.log(`Blog build (${today}): ${posts.length} published, ${future.length} scheduled${future.length ? ' (next: ' + future.map(x => x.date).sort()[0] + ')' : ''}`);
}
build();
