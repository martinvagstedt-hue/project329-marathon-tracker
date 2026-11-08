const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `project329:${SCOPE.href}:`;
const CACHE = `${CACHE_PREFIX}v2`;
const SHELL = new URL('index.html', SCOPE).href;
const ASSETS = new Set([
  'index.html', 'styles.css', 'seed.js', 'app.js',
  'manifest.webmanifest', 'icon192.png', 'icon512.png'
].map(path => new URL(path, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll([...ASSETS].map(url => new Request(url, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  url.search = '';
  const asset = request.mode === 'navigate' && url.href === SCOPE.href ? SHELL : url.href;
  if (!ASSETS.has(asset)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(asset)) || fetch(request);
  })());
});
