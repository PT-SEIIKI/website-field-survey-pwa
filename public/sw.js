// Service Worker untuk PWA - Offline support & Background Sync
// Version: 1.0.5 - Comprehensive offline routing fix

const CACHE_NAME = "survey-pwa-v1.0.5"
const API_CACHE = "survey-api-v1.0.5"
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
  "/globals.css",
  "/_next/static/chunks/main-app.js",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/pages/_app.js"
]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith("http")) return;

  // API calls: Network First
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET") {
      event.respondWith(networkFirst(event.request, API_CACHE));
    }
    return;
  }

  // Navigation (HTML): Network First with full fallback logic
  if (event.request.mode === "navigate" || event.request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
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

  // Assets: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

async function cacheFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  
  // 1. Exact match
  let matched = await cache.match(request);
  if (matched) return matched;

  // 2. Clean URL match (no trailing slash/params)
  const cleanUrl = url.origin + url.pathname.replace(/\/$/, "");
  matched = await cache.match(cleanUrl);
  if (matched) return matched;

  // 3. Known routes fallback
  const routes = ["/login", "/survey/dashboard", "/survey/upload", "/survey/gallery", "/survey/folder"];
  for (const route of routes) {
    if (url.pathname.startsWith(route)) {
      const routeMatch = await cache.match(route);
      if (routeMatch) return routeMatch;
    }
  }

  // 4. Root fallback
  const rootMatch = await cache.match("/");
  if (rootMatch) return rootMatch;

  // 5. Offline page
  return cache.match("/offline.html");
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
}

// Handle background sync
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag)

  if (event.tag === "sync-photos") {
    event.waitUntil(syncPhotos())
  }
})

async function syncPhotos() {
  try {
    console.log("[SW] Starting background sync")

    // Send message to client to trigger sync
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_SYNC",
        tag: "sync-photos",
      })
    })
  } catch (error) {
    console.error("[SW] Background sync failed:", error)
    throw error
  }
}

// Handle messages from client
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
