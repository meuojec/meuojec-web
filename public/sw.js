// MEUOJEC APP — Service Worker
const CACHE = "meuojec-v1";
const OFFLINE_URL = "/offline.html";

// Recursos que se cachean en la instalacion
const PRECACHE = [
  "/",
  "/dashboard",
  "/logo-iglesia.png",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para pages, cache-first para assets estaticos
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Ignorar supabase y otros dominios externos
  if (url.origin !== self.location.origin) return;

  // Assets estaticos: cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/logo") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Pages: network first, sin fallback offline para mantener autenticacion
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
