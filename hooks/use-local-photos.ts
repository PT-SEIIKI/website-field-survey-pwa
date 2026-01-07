"use client"

import { useEffect, useState } from "react"
import { getLocalPhotos, type PhotoData } from "@/lib/photo-manager"

export function useLocalPhotos() {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshPhotos = async () => {
    try {
      const localPhotos = await getLocalPhotos()
      setPhotos(localPhotos)
    } catch (error) {
      console.error("[v0] Error fetching local photos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshPhotos()

    // Refresh setiap 5 detik
    const interval = setInterval(refreshPhotos, 5000)

    return () => clearInterval(interval)
  }, [])

  return { photos, isLoading, refreshPhotos }
}
