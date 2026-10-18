// POST /api/view {slug}  -> counts one article open (deduped per visitor+article for 30 min)
// GET  /api/view?slug=x  -> {views, readers}
// Privacy: no cookies, no raw IPs stored. "readers" is a HyperLogLog of salted hashes (not reversible).
const crypto = require('crypto');
const { configured, pipeline } = require('./_redis');

const SLUG = /^[a-z0-9][a-z0-9-]{0,110}$/;
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|headless|lighthouse|pagespeed|gtmetrix|monitor|uptime|curl|wget|python|node-fetch|axios|go-http|java\//i;
const SALT = process.env.STATS_SALT || process.env.STATS_TOKEN || 'invoice-luxe';
const day = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const sha = s => crypto.createHash('sha256').update(SALT + '|' + s).digest('hex').slice(0, 32);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured) return res.status(200).json({ views: 0, readers: 0, disabled: true });
  try {
    if (req.method === 'GET') {
      const slug = String(req.query.slug || '');
      if (!SLUG.test(slug)) return res.status(400).json({ error: 'bad slug' });
      const [views, readers] = await pipeline([['GET', 'views:' + slug], ['PFCOUNT', 'u:' + slug]]);
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      return res.status(200).json({ views: Number(views || 0), readers: Number(readers || 0) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const body = await readBody(req);
    const slug = String(body.slug || '');
    if (!SLUG.test(slug)) return res.status(400).json({ error: 'bad slug' });

    const ua = String(req.headers['user-agent'] || '');
    const origin = String(req.headers.origin || req.headers.referer || '');
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const country = String(req.headers['x-vercel-ip-country'] || 'XX').toUpperCase().slice(0, 2);
    const fromSite = !origin || /invoiceluxe\.com|localhost|127\.0\.0\.1|\.vercel\.app/i.test(origin);

    const counts = async () => {
      const [v, r] = await pipeline([['GET', 'views:' + slug], ['PFCOUNT', 'u:' + slug]]);
      return res.status(200).json({ views: Number(v || 0), readers: Number(r || 0) });
    };
    if (!ua || BOT.test(ua) || !fromSite) return counts();   // bots / foreign origins are never counted

    const visitor = sha(ip + '|' + ua);
    const hour = new Date().toISOString().slice(0, 13);
    const [first, rl] = await pipeline([
      ['SET', `dd:${visitor}:${slug}`, '1', 'NX', 'EX', '1800'],
      ['INCR', `rl:${visitor}:${hour}`],
      ['EXPIRE', `rl:${visitor}:${hour}`, '3700'],
    ]);
    if (first !== 'OK' || Number(rl) > 200) return counts();  // refresh / repeat within 30 min, or flooding

    const out = await pipeline([
      ['INCR', 'views:' + slug],
      ['PFADD', 'u:' + slug, visitor],
      ['HINCRBY', 'd:' + slug, day(), 1],
      ['HINCRBY', 'c:' + slug, country, 1],
      ['SADD', 'slugs', slug],
      ['PFCOUNT', 'u:' + slug],
    ]);
    return res.status(200).json({ views: Number(out[0]), readers: Number(out[5]) });
  } catch (e) {
    return res.status(200).json({ views: 0, readers: 0, error: true });
  }
};
