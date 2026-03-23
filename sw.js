// Service Worker — Semi-Marathon App
// Version : incrémentée à chaque déploiement pour forcer le rechargement
const VERSION = 'v' + Date.now();
const CACHE = 'semi-marathon-' + VERSION;

// Fichiers à mettre en cache pour le mode hors ligne
const ASSETS = [
  './',
  './index.html'
];

// Installation : mise en cache des assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // Forcer l'activation immédiate sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation : supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
  // Notifier tous les onglets qu'une nouvelle version est disponible
  self.clients.matchAll().then(clients =>
    clients.forEach(c => c.postMessage({ type: 'NEW_VERSION' }))
  );
});

// Fetch : network first, cache fallback
self.addEventListener('fetch', e => {
  // Ne pas intercepter les requêtes Firebase/Anthropic
  if(e.request.url.includes('firebase') ||
     e.request.url.includes('firestore') ||
     e.request.url.includes('anthropic') ||
     e.request.url.includes('googleapis')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Mettre à jour le cache avec la nouvelle version
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
