// Service Worker untuk PWA - Offline support & Background Sync
// Version: 1.0.9 - Added Background Sync for photo upload
const CACHE_NAME = "survey-pwa-v1.0.9"
const API_CACHE = "survey-api-v1.0.9"
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/survey/dashboard",
  "/survey/upload",
  "/survey/gallery",
  "/survey/folder",
  "/admin",
  "/admin/users",
  "/admin/stats",
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
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          // Validate URL before caching
          try {
            new URL(url, self.location.origin);
            return cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
              return Promise.resolve(); // Continue with other assets
            });
          } catch (e) {
            console.warn(`[SW] Invalid URL ${url}:`, e);
            return Promise.resolve();
          }
        })
      );
    }).then(() => {
      console.log("[SW] Pre-caching completed");
    }).catch((err) => {
      console.error("[SW] Pre-cache error:", err);
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
      try {
        event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
      } catch (e) {
        console.warn("[SW] Font fetch error:", e);
      }
    }
    return;
  }

  // API calls: Network First
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET") {
      try {
        event.respondWith(networkFirst(event.request, API_CACHE));
      } catch (e) {
        console.warn("[SW] API fetch error:", e);
      }
    }
    return;
  }

  // Navigation (HTML): Network First with robust fallback
  if (event.request.mode === "navigate") {
    try {
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
    } catch (e) {
      console.warn("[SW] Navigation fetch error:", e);
    }
    return;
  }

  // Handle Dynamic Image Loading (Uploads)
  if (url.pathname.startsWith("/uploads/")) {
    try {
      event.respondWith(staleWhileRevalidate(event.request, API_CACHE));
    } catch (e) {
      console.warn("[SW] Upload fetch error:", e);
    }
    return;
  }

  // Static Assets & Others: Stale While Revalidate
  try {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
  } catch (e) {
    console.warn("[SW] Static asset fetch error:", e);
  }
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
  const routes = [
    "/", 
    "/login", 
    "/survey/dashboard", 
    "/survey/upload", 
    "/survey/gallery", 
    "/survey/folder",
    "/admin",
    "/admin/users",
    "/admin/stats"
  ];
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

// ===================================================================
// BACKGROUND SYNC HANDLER untuk Auto-Upload saat Online Kembali
// ===================================================================

// Background Sync Handler untuk Auto-Upload saat Online Kembali
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background Sync event triggered:', event.tag)
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(handlePhotoSync())
  }
})

async function handlePhotoSync() {
  try {
    console.log('[SW] 📤 Starting photo sync process...')
    
    // Get all active clients (browser tabs with the app open)
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    
    if (clients.length > 0) {
      console.log(`[SW] 📢 Notifying ${clients.length} client(s) to start sync`)
      
      // Notify each client to trigger their sync manager
      for (const client of clients) {
        client.postMessage({
          type: 'BACKGROUND_SYNC_TRIGGERED',
          tag: 'sync-photos',
          timestamp: Date.now()
        })
      }
      
      console.log('[SW] ✅ Sync notifications sent successfully')
      return true
    } else {
      // No clients open - sync will happen when app opens next time
      console.log('[SW] ⏳ No active clients - sync will run when app opens')
      return false
    }
    
  } catch (error) {
    console.error('[SW] ❌ Background sync error:', error)
    // Re-throw to tell browser to retry later
    throw error
  }
}

// Helper: Log sync registrations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_REGISTERED') {
    console.log('[SW] 📝 Sync registered from client:', event.data.tag)
  }
})

console.log('[SW] 🎯 Background Sync handler loaded and ready')
