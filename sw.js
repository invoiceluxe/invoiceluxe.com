/* Invoice Luxe service worker: network-first, falls back to cache when offline (per-language home as fallback). */
const CACHE = 'invoiceluxe-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function homeFor(url) {
  const seg = new URL(url).pathname.split('/')[1] || '';
  return /^[a-z]{2}$/.test(seg) ? '/' + seg + '/' : '/';
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match(homeFor(req.url)) : null) || caches.match('/')))
  );
});
