// Runs every day at 05:00 UTC and triggers a new Netlify build,
// so articles whose date has arrived get published automatically.
export default async () => {
  const hook = process.env.BUILD_HOOK_URL;
  if (!hook) return new Response('BUILD_HOOK_URL is not set', { status: 500 });
  const r = await fetch(hook, { method: 'POST' });
  return new Response(`Build triggered: ${r.status}`);
};

export const config = { schedule: '0 5 * * *' };
