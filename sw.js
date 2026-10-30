// Chalk Talk works offline: the board, the libraries, sketching and the device voice.
// The AI API is never cached (it's live by nature), and neither is anything a coach typed.
const V = '__BUILD__', SHELL = '__SHELL__';
self.addEventListener('install', e => {
  e.waitUntil(caches.open('ct-' + V).then(c => c.addAll(JSON.parse(SHELL))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ct-') && k !== 'ct-' + V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.includes('/api/')) return;
  const page = e.request.mode === 'navigate';
  // pages: network first (fresh when online), the cache when not; everything else: cache first
  e.respondWith(page
    ? fetch(e.request).then(r => { const c = r.clone(); caches.open('ct-' + V).then(x => x.put('./', c)); return r; }).catch(() => caches.match('./'))
    : caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok && (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))) { const c = r.clone(); caches.open('ct-' + V).then(x => x.put(e.request, c)); }
        return r;
      })));
});
