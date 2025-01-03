// sw.js - Modified service worker code
const CACHE_VERSION = 'v4.3';
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
  // Don't activate the new service worker automatically
  event.preventDefault();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Installing new cache version:', CACHE_VERSION);
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Don't take control of clients automatically
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
      // Notify clients about available update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Fetch Event with network-first strategy
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
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Add message handler for update requests
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Client-side update handling code (add to both app.html and index.html)
function initializeUpdateHandling() {
  let refreshing = false;

  // Check for new service worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Listen for update messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'UPDATE_AVAILABLE') {
      showUpdateNotification();
    }
  });
}

function showUpdateNotification() {
  const updateNotification = document.createElement('div');
  updateNotification.className = 'fixed bottom-4 left-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 z-50';
  updateNotification.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="font-bold">Оновлення доступне!</p>
        <p>Нова версія застосунку готова.</p>
      </div>
      <button id="updateButton" class="bg-blue-500 text-white px-4 py-2 rounded ml-4 hover:bg-blue-600">
        Оновити
      </button>
    </div>
  `;
  
  document.body.appendChild(updateNotification);
  
  document.getElementById('updateButton').addEventListener('click', () => {
    // Clear data while preserving essential items
    const authData = localStorage.getItem('authData');
    const apiKey = localStorage.getItem('geminiApiKey');
    
    localStorage.clear();
    
    if (apiKey) localStorage.setItem('geminiApiKey', apiKey);
    if (authData) localStorage.setItem('authData', authData);
    
    // Tell service worker to skip waiting and activate new version
    navigator.serviceWorker.ready.then(registration => {
      registration.waiting.postMessage({ action: 'skipWaiting' });
    });
  });
}

// Initialize update handling when the page loads
if ('serviceWorker' in navigator) {
  initializeUpdateHandling();
}