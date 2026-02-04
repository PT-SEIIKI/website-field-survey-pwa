'use client'

import { useEffect, useState } from 'react'
import { getPendingPhotos, startSync } from '@/lib/sync-manager'
import type { PendingPhoto } from '@/lib/sync-manager'

export function SyncStatus() {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStats, setSyncStats] = useState({ success: 0, failed: 0, total: 0 })

  // ===== LOAD PENDING PHOTOS =====
  const loadPendingPhotos = async () => {
    console.log('🔄 [SyncStatus] Loading pending photos...')
    try {
      const photos = await getPendingPhotos()
      console.log('[SyncStatus] Pending photos:', photos.length)
      
      if (photos.length !== pendingPhotos.length) {
        console.log('[SyncStatus] Photo count changed, updating UI')
        setPendingPhotos(photos)
      }
    } catch (error) {
      console.error('[SyncStatus] Error loading pending photos:', error)
    }
  }

  useEffect(() => {
    console.log('🎯 [SyncStatus] Component mounted')

    // Set initial online status
    setIsOnline(navigator.onLine)
    console.log('[SyncStatus] Initial online status:', navigator.onLine)

    // ===== ONLINE/OFFLINE LISTENERS =====
    const handleOnline = () => {
      console.log('🌐 [SyncStatus] Online event')
      setIsOnline(true)
      loadPendingPhotos()
    }

    const handleOffline = () => {
      console.log('📴 [SyncStatus] Offline event')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // ===== PHOTO SYNCED EVENT LISTENER =====
    const handlePhotoSynced = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('✅ [SyncStatus] Photo synced event received:', customEvent.detail)
      loadPendingPhotos()
    }

    window.addEventListener('photo-synced', handlePhotoSynced)

    // ===== SYNC COMPLETED EVENT LISTENER =====
    const handleSyncCompleted = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('✅ [SyncStatus] Sync completed event received:', customEvent.detail)
      
      setSyncStats({
        success: customEvent.detail.successCount,
        failed: customEvent.detail.failedCount,
        total: customEvent.detail.totalCount,
      })
      
      setLastSyncTime(new Date())
      loadPendingPhotos()
    }

    window.addEventListener('sync-completed', handleSyncCompleted)

    // ===== INITIAL LOAD =====
    loadPendingPhotos()

    // ===== AUTO-REFRESH EVERY 5 SECONDS =====
    console.log('[SyncStatus] Starting auto-refresh interval (5s)')
    const interval = setInterval(() => {
      console.log('[SyncStatus] Auto-refresh triggered')
      loadPendingPhotos()
    }, 5000)

    // ===== CLEANUP =====
    return () => {
      console.log('[SyncStatus] Component unmounting, cleaning up listeners')
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('photo-synced', handlePhotoSynced)
      window.removeEventListener('sync-completed', handleSyncCompleted)
      clearInterval(interval)
    }
  }, [])

  // ===== MANUAL RETRY HANDLER =====
  const handleManualSync = async () => {
    console.log('🔄 [SyncStatus] Manual sync triggered by user')
    
    if (!navigator.onLine) {
      console.warn('[SyncStatus] Cannot sync - device is offline')
      alert('Tidak dapat menyinkronkan - perangkat sedang offline')
      return
    }

    if (isSyncing) {
      console.warn('[SyncStatus] Sync already in progress')
      return
    }

    setIsSyncing(true)
    console.log('[SyncStatus] Starting manual sync...')

    try {
      await startSync()
      console.log('[SyncStatus] Manual sync completed')
      
      // Refresh photos after sync
      await loadPendingPhotos()
      
      alert('Sinkronisasi selesai!')
    } catch (error) {
      console.error('[SyncStatus] Manual sync error:', error)
      alert('Sinkronisasi gagal: ' + (error as Error).message)
    } finally {
      setIsSyncing(false)
      console.log('[SyncStatus] Manual sync process finished')
    }
  }

  // ===== STATUS BADGE =====
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Tertunda
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Gagal
          </span>
        )
      case 'synced':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Berhasil
          </span>
        )
      default:
        return null
    }
  }

  console.log('[SyncStatus] Rendering with:', {
    pendingCount: pendingPhotos.length,
    isSyncing,
    isOnline,
  })

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Status Sinkronisasi
        </h3>
        
        {/* Online/Offline Indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* PENDING COUNT */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Foto belum tersinkron:</span>
          <span className={`text-2xl font-bold ${
            pendingPhotos.length > 0 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {pendingPhotos.length}
          </span>
        </div>
      </div>

      {/* LAST SYNC TIME */}
      {lastSyncTime && (
        <div className="mb-3 text-xs text-gray-500">
          Sinkronisasi terakhir: {lastSyncTime.toLocaleTimeString('id-ID')}
          <br />
          Berhasil: {syncStats.success} | Gagal: {syncStats.failed}
        </div>
      )}

      {/* PENDING PHOTOS LIST */}
      {pendingPhotos.length > 0 && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {pendingPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Photo Info */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photo.fileName || `Foto #${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {photo.blob
                      ? `${(photo.blob.size / 1024).toFixed(2)} KB` 
                      : 'No data'}
                  </p>
                </div>
                {getStatusBadge(photo.syncStatus)}
              </div>

              {/* Sync Attempts */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Percobaan:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((attempt) => (
                    <div
                      key={attempt}
                      className={`w-2 h-2 rounded-full ${
                        attempt <= photo.syncAttempts
                          ? photo.syncStatus === 'failed'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span>
                  {photo.syncAttempts}/3
                </span>
              </div>

              {/* Error Message if Failed */}
              {photo.syncStatus === 'failed' && photo.syncAttempts >= 3 && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ Maksimal percobaan tercapai
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NO PENDING PHOTOS */}
      {pendingPhotos.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-green-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium">Semua foto sudah tersinkron!</p>
        </div>
      )}

      {/* SYNC BUTTON */}
      {pendingPhotos.length > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isSyncing || !isOnline
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isSyncing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Menyinkronkan...
            </span>
          ) : !isOnline ? (
            'Tidak Dapat Sync (Offline)'
          ) : (
            `Sinkronkan Sekarang (${pendingPhotos.length})` 
          )}
        </button>
      )}

      {/* DEBUG INFO (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
          <div>Syncing: {isSyncing ? 'Yes' : 'No'}</div>
          <div>Online: {isOnline ? 'Yes' : 'No'}</div>
          <div>Pending: {pendingPhotos.length}</div>
        </div>
      )}
    </div>
  )
}
