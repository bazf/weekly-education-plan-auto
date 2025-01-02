// js/pwa-install.js

let deferredPrompt;
const installContainer = document.getElementById('installContainer');
const installButton = document.getElementById('installButton');
const installModal = document.getElementById('installModal');
const closeInstallModal = document.getElementById('closeInstallModal');
const installSuccess = document.getElementById('installSuccess');

function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  if (!isPWAInstalled()) {
    installContainer.classList.remove('hidden');
  }
});

installButton?.addEventListener('click', async () => {
  if (!deferredPrompt) {
    installModal.classList.remove('hidden');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    showInstallSuccess();
  }
  deferredPrompt = null;
  installContainer.classList.add('hidden');
});

closeInstallModal?.addEventListener('click', () => {
  installModal.classList.add('hidden');
});

installModal?.addEventListener('click', (e) => {
  if (e.target === installModal) {
    installModal.classList.add('hidden');
  }
});

function showInstallSuccess() {
  installSuccess.classList.remove('hidden');
  setTimeout(() => {
    installSuccess.classList.add('hidden');
  }, 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  if (isPWAInstalled()) {
    installContainer?.classList.add('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  installContainer?.classList.add('hidden');
  showInstallSuccess();
});
