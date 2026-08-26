const CACHE_NAME = 'smpn4-majenang-v15'

const APP_SHELL = [
  '/',
  '/profil.html',
  '/styles.css',
  '/typography.css',
  '/brand.css',
  '/section-navigation.css',
  '/app.js',
  '/site-profile.js',
  '/logo-smpn4-transparan.png',
  '/kepala-sekolah.jpg',
  '/profile-principal.css',
  '/manifest.webmanifest'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )

  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )

  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin)
  ) {
    return
  }

  const url = new URL(request.url)

  const isAdminRequest =
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api/admin/') ||
    url.pathname.startsWith('/api/auth/')

  if (isAdminRequest) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )

    return
  }

  const isPublicApi = url.pathname.startsWith('/api/public/')

  if (isPublicApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy)
            })
          }

          return response
        })
        .catch(() => caches.match(request))
    )

    return
  }

  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy)
            })
          }

          return response
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/')
          )
        )
    )

    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy)
            })
          }

          return response
        })
        .catch(() => caches.match('/'))
    })
  )
})
