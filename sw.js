// Increment this version when you want to force an update
const CACHE_VERSION = 'v3.4';
const CACHE_NAME = `planuvannya-${CACHE_VERSION}`;
const BASE_PATH = '/weekly-education-plan-auto';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.html`,
  `${BASE_PATH}/instructions.html`,
  `${BASE_PATH}/auth-config.js`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/3rd-party/js/tailwindcss.js`,
  `${BASE_PATH}/3rd-party/js/crypto-js.js`,
  `${BASE_PATH}/icons/icon-152x152.png`
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Installing new cache version:', CACHE_VERSION);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients
      self.clients.claim(),
      
      // Remove old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      // Notify all clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Fetch Event with network-first strategy and proper request filtering
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);
  
  const shouldCache = 
    requestURL.origin === location.origin || 
    requestURL.hostname === 'cdnjs.cloudflare.com';

  if (!shouldCache) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            try {
              cache.put(event.request, responseToCache);
            } catch (error) {
              console.warn('Failed to cache response:', error);
            }
          })
          .catch(error => {
            console.warn('Failed to open cache:', error);
          });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});