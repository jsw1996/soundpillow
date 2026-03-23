// Service Worker — cache-first for audio & image assets from Azure Blob Storage.
// This caches ambient track audio and cover images after first fetch so subsequent
// plays load instantly without re-downloading.

const CACHE_NAME = 'soundpillow-assets-v1';
const BLOB_ORIGIN = 'soundpillow0308001430.blob.core.windows.net';

// Only cache ambient track audio and cover images, not story narrations or music
// (those are larger one-off files that would fill the cache quickly).
const CACHEABLE_PATH_PREFIXES = [
  '/soundpillow-assets/audios/tracks/',
  '/soundpillow-assets/audios/covers/',
];

function isCacheableRequest(url) {
  if (!url.hostname.includes(BLOB_ORIGIN)) return false;
  return CACHEABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

// Install: pre-cache nothing — we cache on first use
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('soundpillow-assets-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// Fetch: cache-first for blob storage assets, network-only for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (!isCacheableRequest(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      }),
    ),
  );
});
