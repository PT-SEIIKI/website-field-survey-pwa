"use client"

import { useEffect, useState } from "react"
import { subscribeToConnectivity } from "@/lib/connectivity"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = subscribeToConnectivity(setIsOnline)

    return unsubscribe
  }, [])

  return isOnline
}
