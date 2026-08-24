const CACHE_NAME = 'smpn4-majenang-v4'
const APP_SHELL = [
  '/',
  '/profil.html',
  '/styles.css',
  '/typography.css',
  '/brand.css',
  '/app.js',
  '/site-profile.js',
  '/logo-smpn4-transparan.png',
  '/kepala-sekolah.jpg',
  '/profile-principal.css',
  '/manifest.webmanifest'
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return
  if (event.request.destination === 'document' || new URL(event.request.url).pathname.startsWith('/api/public/')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        return response
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
      return response
    }).catch(() => caches.match('/')))
  )
})
