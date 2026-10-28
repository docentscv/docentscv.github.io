/* DocentsCV · service worker mínimo.
   Siempre pide la web a internet (así cualquier cambio llega a todos al momento) y solo guarda una copia
   de la portada para mostrarla si no hay conexión. No guarda datos de la base de datos. */
const CACHE = 'docentscv-shell-1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(ch => ch.put('/', c)); return res; })
      .catch(() => caches.match('/').then(m => m || new Response('Sin conexión. Vuelve a intentarlo cuando tengas internet.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }))));
  }
});

/* Notificaciones push: el servidor envía {title, body, url, tag} cuando se publican plazas ofertadas. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'DocentsCV', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: d.tag || 'docentscv', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { w.navigate && w.navigate(url); return w.focus(); } }
    return self.clients.openWindow(url);
  }));
});
