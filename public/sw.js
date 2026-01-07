// Service Worker untuk PWA - Offline support & Background Sync

const CACHE_NAME = "survey-pwa-v1"
const API_CACHE = "survey-api-v1"
const ASSETS_TO_CACHE = ["/", "/offline.html", "/manifest.json"]

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching essential assets")
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log("[SW] Some assets failed to cache (expected):", err)
      })
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
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
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Handle API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Handle HTML documents
  if (event.request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Handle assets (CSS, JS, images)
  event.respondWith(cacheFirst(event.request))
})

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log("[SW] Fetch failed, trying cache:", request.url)

    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    // Return offline page if available
    if (request.headers.get("Accept")?.includes("text/html")) {
      const offline = await caches.match("/offline.html")
      if (offline) {
        return offline
      }
    }

    return new Response("Offline - Resource not available", {
      status: 503,
      statusText: "Service Unavailable",
    })
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log("[SW] Failed to fetch asset:", request.url)

    // Return placeholder for images
    if (request.destination === "image") {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" fill="#999">Image Offline</text></svg>',
        {
          headers: { "Content-Type": "image/svg+xml" },
        },
      )
    }

    return new Response("Offline - Asset not available", {
      status: 503,
    })
  }
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
