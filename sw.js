const VERSION = 'bhuvan-planner-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      // add files one by one so a single failure never breaks installation
      .then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Pages: network first (so updates show), fall back to cache when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Everything else (icons, fonts, CDN libraries): cache first, then update in background
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(resp => {
          if (resp && (resp.status === 200 || resp.type === 'opaque')) {
            const copy = resp.clone();
            caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
