// The page itself is fetched network-first so updates show on the next open;
// everything else is cache-first so the timer still opens without a connection.
const CACHE = 'pomodoro-v10';
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "bg-desk.webp", "bg-morning.webp", "bg-sunset.webp", "bg-night.webp", "bg-bedroom.webp"];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache, which can still hold the previous version.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      // Keep Google Fonts and anything else fetched later for offline use.
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
