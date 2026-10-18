#!/usr/bin/env node
/* Re-dates every article in content/blog, one per weekday, starting from a date you choose.
   Keeps the current order (by date, then file name) and renames the files to match.
   Usage:  node reschedule.js 2026-10-19            (Mon-Fri, 1 per day)
           node reschedule.js 2026-10-19 7          (every day, 1 per day)  */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'content', 'blog');
const start = process.argv[2], daysPerWeek = process.argv[3] === '7' ? 7 : 5;
if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) { console.log('Usage: node reschedule.js YYYY-MM-DD [7]'); process.exit(1); }
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const items = files.map(f => {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = raw.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
  return { f, raw, date: m ? m[1] : '9999-12-31', slug: f.replace(/^\d{4}-\d{2}-\d{2}-/, '') };
}).sort((a, b) => a.date.localeCompare(b.date) || a.f.localeCompare(b.f));
let d = new Date(start + 'T00:00:00Z');
const ok = x => daysPerWeek === 7 || (x.getUTCDay() !== 0 && x.getUTCDay() !== 6);
while (!ok(d)) d.setUTCDate(d.getUTCDate() + 1);
for (const it of items) {
  const nd = d.toISOString().slice(0, 10);
  fs.writeFileSync(path.join(dir, `${nd}-${it.slug}`), it.raw.replace(/^date:\s*\d{4}-\d{2}-\d{2}/m, `date: ${nd}`));
  if (`${nd}-${it.slug}` !== it.f) fs.unlinkSync(path.join(dir, it.f));
  console.log(nd, it.slug);
  do { d.setUTCDate(d.getUTCDate() + 1); } while (!ok(d));
}
