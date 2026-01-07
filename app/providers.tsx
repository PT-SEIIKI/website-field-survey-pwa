"use client"

import type React from "react"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/service-worker-register"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      registerServiceWorker()
    }
  }, [])

  return <>{children}</>
}
