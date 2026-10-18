// Tiny Upstash/Vercel-KV REST client (no dependencies). Env vars are added automatically when you
// connect an Upstash Redis (or Vercel KV) store to the project in Vercel -> Storage.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

exports.configured = Boolean(URL_ && TOKEN);

exports.pipeline = async function pipeline(commands) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis http ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x && x.error) throw new Error(x.error); return x.result; });
};
