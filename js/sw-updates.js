// js/sw-updates.js

// Register the service worker if available
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/weekly-education-plan-auto/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed:', err);
        });
    });
  }
  
  function checkForUpdates() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }
  
  // Periodically check for updates
  setInterval(checkForUpdates, 60 * 60 * 1000);
  
  if ('serviceWorker' in navigator) {
    let refreshing = false;
  
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        // If you want to show an update banner instead, do it here.
        // Or simply reload:
        // window.location.reload();
      }
    });
  }
  
  // Also listen for SW messages
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_UPDATED') {
      // Show update notification
      const updateNotification = document.createElement('div');
      updateNotification.className =
        'fixed bottom-4 left-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 z-50';
      updateNotification.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold">Оновлення доступне!</p>
            <p>Нова версія застосунку готова.</p>
          </div>
          <button id="updateAndReloadBtn" class="bg-blue-500 text-white px-4 py-2 rounded ml-4 hover:bg-blue-600">
            Оновити
          </button>
        </div>
      `;
      document.body.appendChild(updateNotification);
  
      document.getElementById('updateAndReloadBtn').addEventListener('click', () => {
        clearDataOnUpdate();
        window.location.reload();
      });
    }
  });
  
  function clearDataOnUpdate() {
    // If you'd like to selectively clear localStorage or other data:
    // const authData = localStorage.getItem('authData');
    // const apiKey = localStorage.getItem('geminiApiKey');
    // localStorage.clear();
    // if (apiKey) localStorage.setItem('geminiApiKey', apiKey);
    // if (authData) localStorage.setItem('authData', authData);
  }
  
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
      const authData = localStorage.getItem('authData');
      const apiKey = localStorage.getItem('geminiApiKey');
  
      localStorage.clear();
      if (apiKey) localStorage.setItem('geminiApiKey', apiKey);
      if (authData) localStorage.setItem('authData', authData);
  
      // Tell service worker to skip waiting
      navigator.serviceWorker.ready.then(registration => {
        registration.waiting?.postMessage({ action: 'skipWaiting' });
      });
    });
  }
  
  if ('serviceWorker' in navigator) {
    initializeUpdateHandling();
  }
  