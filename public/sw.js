const CACHE = 'completando-v1'

// Assets estáticos seguros para cachear (versionados pelo Next.js)
const NEVER_CACHE = ['/api/', '/auth/', '/admin/']

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  // Remove caches antigas
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Só intercepta GET do mesmo domínio
  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return

  // NUNCA cacheia API, auth ou admin
  if (NEVER_CACHE.some(p => url.pathname.startsWith(p))) return

  // Assets estáticos do Next.js: Cache First (são versionados, sem risco)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached ?? fetchAndCache(request))
    )
    return
  }

  // Tudo mais (páginas, imagens): Network First
  // Tenta rede → se falhar usa cache → se não tiver cache, erro
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached
          // Fallback de navegação: mostra a home cacheada
          if (request.mode === 'navigate') return caches.match('/')
          return new Response('', { status: 503 })
        })
      )
  )
})

async function fetchAndCache(request) {
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE)
    cache.put(request, response.clone())
  }
  return response
}
