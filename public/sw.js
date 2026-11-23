/* Vida Activa AI PWA — cache only public shell pages; never cache API or personal data */
const VERSION = 'vida-activa-shell-v1';
const SHELL = ['/', '/offline'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vida-activa-shell-') && k !== VERSION).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || request.headers.has('authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok && url.pathname === '/') {
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put('/', copy)).catch(() => {});
      }
      return response;
    }).catch(async () => (await caches.match(url.pathname)) || (await caches.match('/offline')) || Response.error()));
  }
});
