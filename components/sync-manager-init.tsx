'use client'

import { useEffect } from 'react'
import { initSyncManager } from '@/lib/sync-manager'

/**
 * SyncManagerInit Component
 * 
 * Component ini menginisialisasi sync manager saat aplikasi dimuat.
 * Harus ditempatkan di layout atau root component untuk memastikan
 * sync manager berjalan di semua halaman.
 */
export function SyncManagerInit() {
  useEffect(() => {
    console.log('🔧 [SyncManagerInit] Initializing sync manager...')
    
    // Initialize sync manager hanya di client-side
    if (typeof window !== 'undefined') {
      initSyncManager()
      console.log('✅ [SyncManagerInit] Sync manager initialized')
    } else {
      console.log('⏸️ [SyncManagerInit] Running on server-side, skipping initialization')
    }
  }, [])

  // Component ini tidak render apa-apa
  return null
}
