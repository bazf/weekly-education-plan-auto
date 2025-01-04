// sw.js - Fixed service worker code for GitHub Pages
const CACHE_VERSION = 'v4.5';
const CACHE_NAME = `planuvannya-${CACHE_VERSION}`;
const BASE_PATH = '/weekly-education-plan-auto';

// Add BASE_PATH to all URLs that need to be cached
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.html`,
  `${BASE_PATH}/instructions.html`,
  `${BASE_PATH}/manifest.json`,
  // JavaScript files
  `${BASE_PATH}/js/ai.js`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/auth-config.js`,
  `${BASE_PATH}/js/modal.js`,
  `${BASE_PATH}/js/pwa-install.js`,
  `${BASE_PATH}/js/sw-updates.js`,
  `${BASE_PATH}/js/tables.js`,
  // Third-party JS
  `${BASE_PATH}/3rd-party/js/tailwindcss.js`,
  `${BASE_PATH}/3rd-party/js/crypto-js.js`,
  // CSS
  `${BASE_PATH}/css/app.css`,
  // Icons
  `${BASE_PATH}/icons/icon-152x152.png`
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Installing new cache version:', CACHE_VERSION);
        // Try to cache each resource individually
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.error(`Failed to cache ${url}:`, error);
              // Continue with other files even if one fails
              return Promise.resolve();
            });
          })
        );
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
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
      // Take control of all clients immediately
      return self.clients.claim().then(() => {
        // Notify clients about available update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: CACHE_VERSION
            });
          });
        });
      });
    })
  );
});

// Modified fetch event handler with GitHub Pages path handling
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);
  
  // Check if the request is for our domain and should be cached
  const shouldCache = 
    requestURL.origin === location.origin || 
    requestURL.hostname === 'cdnjs.cloudflare.com';

  if (!shouldCache) return;

  // For same-origin requests, ensure BASE_PATH is handled correctly
  let fetchRequest = event.request;
  if (requestURL.origin === location.origin) {
    // Remove BASE_PATH from the URL if it's present for cache matching
    const urlWithoutBase = requestURL.pathname.replace(BASE_PATH, '');
    fetchRequest = new Request(`${requestURL.origin}${BASE_PATH}${urlWithoutBase}`, {
      headers: event.request.headers,
      method: event.request.method,
      credentials: event.request.credentials,
      cache: event.request.cache,
      redirect: event.request.redirect,
      referrer: event.request.referrer,
      integrity: event.request.integrity
    });
  }

  event.respondWith(
    fetch(fetchRequest)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache)
              .catch(error => console.error('Cache put error:', error));
          })
          .catch(error => console.error('Cache open error:', error));

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // If the request isn't in the cache, try matching without BASE_PATH
            const urlWithoutBase = requestURL.pathname.replace(BASE_PATH, '');
            const alternateRequest = new Request(`${requestURL.origin}${urlWithoutBase}`);
            return caches.match(alternateRequest);
          })
          .catch(error => {
            console.error('Cache match error:', error);
            return new Response('Network and cache both unavailable');
          });
      })
  );
});

// Message handler for update requests
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});