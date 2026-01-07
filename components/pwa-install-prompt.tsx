"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("[v0] PWA installed")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-border rounded-lg shadow-lg p-4 max-w-xs z-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm mb-1">Install Aplikasi</h3>
          <p className="text-xs text-muted-foreground">Install Survey PWA di perangkat Anda untuk akses lebih cepat</p>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <Button onClick={handleDismiss} variant="outline" size="sm" className="flex-1 bg-transparent">
          Nanti
        </Button>
        <Button onClick={handleInstall} size="sm" className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Install
        </Button>
      </div>
    </div>
  )
}
