const CACHE = 'roadwatch-v3';
const ASSETS = ['/', '/map', '/complaints', '/contractors', '/analytics', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // For specific API endpoints, do stale-while-revalidate
  if (url.pathname.includes('/api/roads') || url.pathname.includes('/api/contractors')) {
    event.respondWith(
      caches.open(CACHE).then(cache => {
        return cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // General requests: network first, fallback to cache
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'roadwatch-offline-sync') {
    event.waitUntil(self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'ROADWATCH_SYNC_REQUEST' }));
    }));
  }
});
