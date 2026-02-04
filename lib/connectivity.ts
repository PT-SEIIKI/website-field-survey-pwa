// Utility untuk detect online/offline status
type ConnectivityListener = (isOnline: boolean) => void

let listeners: ConnectivityListener[] = []
let isOnline = typeof window !== "undefined" ? navigator.onLine : true

export function initConnectivityListener() {
  if (typeof window === "undefined") return

  window.addEventListener("online", () => {
    console.log("[v0] Online detected")
    isOnline = true
    notifyListeners(true)
  })

  window.addEventListener("offline", () => {
    console.log("[v0] Offline detected")
    isOnline = false
    notifyListeners(false)
  })
}

export function subscribeToConnectivity(listener: ConnectivityListener) {
  listeners.push(listener)

  // Immediately call with current status
  listener(isOnline)

  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function notifyListeners(online: boolean) {
  listeners.forEach((listener) => listener(online))
}

export function getOnlineStatus(): boolean {
  return isOnline
}

export function checkConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve(false)
      return
    }

    // Coba fetch ke endpoint kecil dengan timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    fetch("/api/health", { 
      method: "HEAD", 
      cache: "no-store",
      signal: controller.signal 
    })
      .then((response) => {
        clearTimeout(timeoutId)
        resolve(response.ok)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.log('[Connectivity] Health check failed:', error)
        resolve(false)
      })
  })
}
