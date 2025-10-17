const CACHE_NAME = 'dj-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/style.css',
  '/bundle.js',
  '/images/three-dots-blue.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const maybeCacheHTML = (request, response) => {
    if (!response || !response.ok) {
      return;
    }

    const url = new URL(request.url);
    const contentType = response.headers.get('Content-Type') || '';

    if (url.origin === self.location.origin && contentType.includes('text/html')) {
      caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    }
  };

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then(networkResponse => {
              maybeCacheHTML(event.request, networkResponse);
              return networkResponse;
            })
            .catch(() => {})
        );

        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          maybeCacheHTML(event.request, networkResponse);
          return networkResponse;
        })
        .catch(error => {
          throw error;
        });
    })
  );
});
