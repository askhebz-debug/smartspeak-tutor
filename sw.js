const CACHE_NAME = 'smartspeak-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

---

## Step 4: Prepare Logo Images

I-save ang imong logo as:
- **`icon-192.png`** - 192x192 pixels
- **`icon-512.png`** - 512x512 pixels

Put both files sa **root folder** (same level as index.html)

---

## Step 5: Final Folder Structure
```
your-project/
├── index.html          ← Updated with PWA + Footer
├── manifest.json       ← NEW - PWA config
├── sw.js              ← NEW - Service worker
├── icon-192.png       ← NEW - Your logo 192x192
├── icon-512.png       ← NEW - Your logo 512x512
├── package.json
├── netlify.toml
└── netlify/
    └── functions/
        └── ask-ai.js