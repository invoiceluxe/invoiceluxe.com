// GET /api/stats  (Authorization: Bearer <STATS_TOKEN>)  -> per-article numbers for blog-stats.html
const crypto = require('crypto');
const { configured, pipeline } = require('./_redis');
const TOKEN = process.env.STATS_TOKEN || '';
const ok = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const pairs = a => { const o = {}; for (let i = 0; a && i < a.length; i += 2) o[a[i]] = Number(a[i + 1]); return o; };
const ymd = d => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!TOKEN) return res.status(503).json({ error: 'STATS_TOKEN is not set in Vercel environment variables' });
  const given = String((req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.query.token || '');
  if (!ok(given, TOKEN)) return res.status(401).json({ error: 'unauthorized' });
  if (!configured) return res.status(503).json({ error: 'No Redis store connected (Vercel -> Storage -> Upstash Redis)' });
  try {
    const [slugs] = await pipeline([['SMEMBERS', 'slugs']]);
    const cmds = []; (slugs || []).forEach(s => cmds.push(['GET', 'views:' + s], ['PFCOUNT', 'u:' + s], ['HGETALL', 'd:' + s], ['HGETALL', 'c:' + s]));
    const r = cmds.length ? await pipeline(cmds) : [];
    const now = Date.now(), days = n => ymd(new Date(now - n * 864e5));
    const d7 = days(6), d30 = days(29), today = ymd(new Date(now));
    const rows = (slugs || []).map((slug, i) => {
      const daily = pairs(r[i * 4 + 2]), c = pairs(r[i * 4 + 3]);
      const sum = from => Object.entries(daily).filter(([d]) => d >= from).reduce((t, [, v]) => t + v, 0);
      return { slug, views: Number(r[i * 4] || 0), readers: Number(r[i * 4 + 1] || 0), today: daily[today] || 0, last7: sum(d7), last30: sum(d30),
        countries: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5), daily: Object.fromEntries(Object.entries(daily).sort().slice(-14)) };
    });
    res.status(200).json({ generated: new Date().toISOString(), rows });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
