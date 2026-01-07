"use client"

import { useEffect, useState } from "react"
import { subscribeSyncStatus, getSyncStatus, type SyncStatus } from "@/lib/sync-manager"

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    totalPending: 0,
    isSyncing: false,
  })

  useEffect(() => {
    // Get initial status
    getSyncStatus().then(setStatus)

    // Subscribe to updates
    const unsubscribe = subscribeSyncStatus(setStatus)

    return unsubscribe
  }, [])

  return status
}
