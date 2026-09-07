/* ============================================================
   Notifications push (optionnel) : colle ICI la même config
   Firebase que dans index.html, pour que les notifications
   s'affichent même quand l'app est en arrière-plan.
   ============================================================ */
const FIREBASE_CONFIG = {
  apiKey: "COLLE_TA_CLE_ICI",
  authDomain: "TON-PROJET.firebaseapp.com",
  projectId: "TON-PROJET",
  storageBucket: "TON-PROJET.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx"
};

try{
  if(FIREBASE_CONFIG.apiKey !== "COLLE_TA_CLE_ICI"){
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(FIREBASE_CONFIG);
    firebase.messaging(); // active l'affichage automatique des notifications reçues en arrière-plan
  }
}catch(e){ /* config pas encore prête : le reste du service worker marche quand même */ }

/* ---------------- cache hors-ligne (PWA) ---------------- */
const CACHE_NAME = 'regisseur-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first for everything (chat needs live data); falls back to cache when offline,
// so the app shell still opens without a connection.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Ne touche qu'aux fichiers de l'app elle-même. Laisse passer tout le reste
  // (Firestore, Auth, Cloud Messaging...) sans y toucher — sinon ça casse le
  // chat en temps réel et les connexions Firebase.
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
