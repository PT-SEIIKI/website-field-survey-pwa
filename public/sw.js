// Service Worker untuk PWA - Offline support & Background Sync
// Version: 1.0.7 - Improved offline routing & caching
const CACHE_NAME = "survey-pwa-v1.0.7"
const API_CACHE = "survey-api-v1.0.7"
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/survey/dashboard",
  "/survey/upload",
  "/survey/gallery",
  "/survey/folder",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-light-32x32.png",
  "/apple-icon.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/logo.png",
]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching assets...");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error("[SW] Pre-cache error:", err);
      });
    })
  );
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
})

// Fetch event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (!url.protocol.startsWith("http")) return;

  // Ignore browser extensions and other external requests
  if (url.origin !== self.location.origin) {
    // Exception for fonts or common CDNs if needed
    if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
      event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
    }
    return;
  }

  // API calls: Network First
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET") {
      event.respondWith(networkFirst(event.request, API_CACHE));
    }
    return;
  }

  // Navigation (HTML): Network First with robust fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          }
          return cacheFallback(event.request);
        })
        .catch(() => cacheFallback(event.request))
    );
    return;
  }

  // Handle Dynamic Image Loading (Uploads)
  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE));
    return;
  }

  // Static Assets & Others: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

async function cacheFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  
  // 1. Try exact match from cache
  const matched = await cache.match(request);
  if (matched) return matched;

  // 2. Try matching without trailing slash
  const cleanUrl = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
  const cleanMatch = await cache.match(cleanUrl);
  if (cleanMatch) return cleanMatch;

  // 3. Known routes fallback (SPA-like behavior)
  const routes = ["/login", "/survey/dashboard", "/survey/upload", "/survey/gallery", "/survey/folder"];
  for (const route of routes) {
    if (url.pathname.startsWith(route)) {
      const routeMatch = await cache.match(route);
      if (routeMatch) return routeMatch;
    }
  }

  // 4. Default fallbacks
  const rootMatch = await cache.match("/");
  if (rootMatch) return rootMatch;

  const offlineMatch = await cache.match("/offline.html");
  if (offlineMatch) return offlineMatch;

  return new Response("Offline content not available", {
    status: 503,
    statusText: "Service Unavailable",
    headers: new Headers({ "Content-Type": "text/plain" })
  });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline", message: "Network request failed" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Handle skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
