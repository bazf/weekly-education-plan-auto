// Increment this version when you want to force an update
const CACHE_VERSION = 'v3';
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
        console.log('Installing new cache version');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force activation by skipping waiting
        return self.skipWaiting();
      })
  );
});

// Activate Event (Clean up old caches)
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
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
    ])
  );
});

// Fetch Event with network-first strategy for HTML files
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200) {
          throw new Error('Network response was not ok');
        }

        // Clone the response
        const responseToCache = response.clone();

        // Update cache
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});