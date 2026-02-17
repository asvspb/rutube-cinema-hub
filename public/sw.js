/**
 * Service Worker for Rutube Cinema Hub
 * Provides offline caching for static assets
 * @version 1.0.0
 */

const CACHE_NAME = 'rutube-cinema-hub-v1';
const STATIC_CACHE_NAME = 'rutube-cinema-hub-static-v1';

// Static assets to cache on install
const STATIC_ASSETS = ['/', '/index.html', '/favicon_rh.svg'];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always fetch fresh
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('rutube.ru') ||
    url.hostname.includes('google') ||
    url.hostname.includes('esm.sh')
  ) {
    return;
  }

  // For navigation requests (HTML pages), try network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the new version
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // For static assets, try cache first, fallback to network
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        event.waitUntil(
          fetch(request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // Ignore network errors for background update
            })
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then(response => {
        // Cache the new resource
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      })
      .then(() => {
        // Notify the main thread
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      });
  }
});
