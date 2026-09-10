/*
 * Service worker minimo para que la app siga funcionando sin conexion.
 * Los datos viven en localStorage, asi que solo hay que cachear el shell.
 */
const CACHE = 'fit-v1'
const BASE = new URL('./', self.location).pathname

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([BASE, `${BASE}index.html`]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return
  if (new URL(peticion.url).origin !== self.location.origin) return

  // Navegacion: red primero para recibir despliegues nuevos, cache si no hay red.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE).then((cache) => cache.put(peticion, copia))
          return respuesta
        })
        .catch(() =>
          caches.match(peticion).then((guardada) => guardada || caches.match(`${BASE}index.html`)),
        ),
    )
    return
  }

  // Recursos: cache primero. Vite versiona los nombres, asi que no queda obsoleto.
  evento.respondWith(
    caches.match(peticion).then(
      (guardada) =>
        guardada ||
        fetch(peticion).then((respuesta) => {
          if (respuesta.ok && respuesta.type === 'basic') {
            const copia = respuesta.clone()
            caches.open(CACHE).then((cache) => cache.put(peticion, copia))
          }
          return respuesta
        }),
    ),
  )
})
