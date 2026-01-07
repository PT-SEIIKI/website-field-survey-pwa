export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers tidak tersedia di browser ini")
    return
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    console.log("[v0] Service Worker registered:", registration)

    // Cek untuk update setiap jam
    setInterval(() => {
      registration.update()
    }, 3600000)

    // Handle new service worker
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[v0] New service worker available, please refresh")
          }
        })
      }
    })
  } catch (error) {
    console.error("[v0] Service Worker registration failed:", error)
  }
}

export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
    }
    console.log("[v0] Service Worker unregistered")
  } catch (error) {
    console.error("[v0] Service Worker unregistration failed:", error)
  }
}
