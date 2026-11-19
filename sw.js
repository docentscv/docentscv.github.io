/* DocentsCV · service worker mínimo.
   Siempre pide la web a internet (así cualquier cambio llega a todos al momento) y solo guarda una copia
   de la portada para mostrarla si no hay conexión. No guarda datos de la base de datos. */
const CACHE = 'docentscv-shell-2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      // Solo guardamos la copia si la respuesta llegó COMPLETA y correcta (status 200).
      // Si la conexión se corta a mitad de la descarga, res.clone().text() falla y no se guarda nada
      // a medias; así nunca quedamos con una copia rota sirviéndose para siempre sin conexión.
      if (res.ok) {
        res.clone().text().then(texto => caches.open(CACHE).then(ch => ch.put('/', new Response(texto, { headers: res.headers })))).catch(() => {});
      }
      return res;
    }).catch(() => caches.match('/').then(m => m || new Response('Sin conexión. Vuelve a intentarlo cuando tengas internet.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }))));
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
