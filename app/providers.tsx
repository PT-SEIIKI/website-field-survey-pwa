"use client"

import type React from "react"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/service-worker-register"
import "@/lib/offline-sync-queue"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      registerServiceWorker()
    }

    // Initialize offline sync queue
    if (typeof window !== 'undefined') {
      import("@/lib/offline-sync-queue").then(({ offlineSyncQueue }) => {
        // Load existing sync operations
        offlineSyncQueue.loadFromIndexedDB().then(() => {
          console.log("[Providers] Offline sync queue initialized")
        })
      })
    }
  }, [])

  return <>{children}</>
}
