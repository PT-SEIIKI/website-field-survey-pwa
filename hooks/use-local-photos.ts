"use client"

import { useEffect, useState } from "react"
import { getLocalPhotos, type PhotoData } from "@/lib/photo-manager"
import { checkStorageQuota, cleanupSyncedPhotos } from "@/lib/indexeddb"
import { toast } from "sonner"

export function useLocalPhotos() {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [storageStatus, setStorageStatus] = useState({ usage: 0, quota: 0, isLow: false })

  const refreshPhotos = async () => {
    try {
      const [localPhotos, quota] = await Promise.all([
        getLocalPhotos(),
        checkStorageQuota()
      ])
      setPhotos(localPhotos)
      setStorageStatus(quota)

      if (quota.isLow) {
        toast.warning("Penyimpanan Lokal Hampir Penuh", {
          description: "Mencoba membersihkan foto yang sudah tersinkronisasi...",
        })
        const cleaned = await cleanupSyncedPhotos()
        if (cleaned > 0) {
          toast.success("Pembersihan Berhasil", {
            description: `${cleaned} foto lama telah dihapus dari perangkat ini.`
          })
          // Refresh after cleanup
          const updatedPhotos = await getLocalPhotos()
          setPhotos(updatedPhotos)
        }
      }
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

  return { photos, isLoading, refreshPhotos, storageStatus }
}
