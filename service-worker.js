/* LagLens Service Worker v2.1.1 */
const CACHE_NAME = 'laglens-cache-v2.1.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './privacy.html',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.warn('Pre-cache error (non-fatal):', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Diagnostic requests must reach the network and must never be cached.
  const url = event.request.url;
  if (url.includes('_ll=') || url.includes('generate_204') || url.includes('/cdn-cgi/trace')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
