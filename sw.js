const CACHE = 'cashchroma-v1'
const STATIC = ['/', '/style.css', '/manifest.json', '/icons/icon.svg']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Don't intercept Supabase API calls or Google Fonts
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE).then(cache => cache.put(event.request, res.clone()))
        }
        return res
      }).catch(() => cached)

      return cached || networkFetch
    })
  )
})
