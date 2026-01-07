// Background Sync API utilities
export async function registerBackgroundSync(tag = "sync-photos") {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    console.log("[v0] Background Sync tidak tersedia di browser ini")
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if (registration.sync) {
      await registration.sync.register(tag)
      console.log("[v0] Background sync registered:", tag)
      return true
    }
  } catch (error) {
    console.error("[v0] Background sync registration failed:", error)
  }

  return false
}

export function setupBackgroundSyncListener() {
  if (!("serviceWorker" in navigator)) return

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "BACKGROUND_SYNC") {
      console.log("[v0] Background sync message received:", event.data.tag)

      // Trigger sync
      const { startSync } = require("./sync-manager")
      startSync()
    }
  })
}
