const CACHE = 'jbs-pos-202605090750';

// On install — cache the app files
self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait
  e.waitUntil(
    caches.open(CACHE).then(c => 
      c.addAll([
        '/JBS---POS/',
        '/JBS---POS/index.html',
        '/JBS---POS/icon.svg',
        '/JBS---POS/manifest.json'
      ]).catch(() => {})
    )
  );
});

// On activate — delete ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k))) // delete everything, including current
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

// On fetch — NETWORK FIRST strategy
// Always try the network first. Only use cache if network fails (truly offline)
self.addEventListener('fetch', e => {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;
  
  // For Firebase/Google API calls — never cache, always network
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) {
    return; // let it go straight to network, no caching
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Got fresh response from network — update cache and return it
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => {
        // Network failed (offline) — fall back to cache
        return caches.match(e.request)
          .then(cached => cached || caches.match('/JBS---POS/index.html'));
      })
  );
});

// Listen for SKIP_WAITING message from the app
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
