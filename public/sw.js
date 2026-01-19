// Service Worker untuk PWA - Offline support & Background Sync
// Version: 1.0.3 - Triggering update

const CACHE_NAME = "survey-pwa-v1.0.3"
const API_CACHE = "survey-api-v1.0.3"
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
  "/globals.css"
]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching essential assets")
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log("[SW] Some assets failed to cache (expected):", err)
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      }),
      self.clients.claim()
    ])
  )
})

// Fetch event - network-first for HTML, stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith("http")) {
    return
  }

  // Handle API calls - Network First
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET") {
      event.respondWith(networkFirst(event.request, API_CACHE))
    }
    return
  }

  // Handle HTML documents - Network First with Cache Fallback
  if (event.request.headers.get("Accept")?.includes("text/html") || event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, CACHE_NAME, "/offline.html"))
    return
  }

  // Handle assets (CSS, JS, images) - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME))
})

// Network first strategy with fallback
async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url)
    const cached = await cache.match(request)
    if (cached) return cached
    
    if (fallback) {
      return caches.match(fallback)
    }
    
    return new Response("Offline - Resource not available", {
      status: 503,
      statusText: "Service Unavailable",
    })
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => cachedResponse)

  return cachedResponse || fetchPromise
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
