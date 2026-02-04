// Sync manager untuk handle upload queue dan auto-sync
// Enhanced version with extensive logging and event dispatch
import {
  getPendingPhotos,
  updatePhotoStatus,
  getAllPhotos,
  getFolders,
  getVillages,
  getSubVillages,
  getHouses,
  saveVillage,
  saveSubVillage,
  saveHouse,
  saveFolder,
} from './indexeddb'

// Re-export getPendingPhotos for components
export { getPendingPhotos } from './indexeddb'

// Sync status interface
export interface SyncStatus {
  totalPending: number
  isSyncing: boolean
  lastSyncTime?: Date
}

// Sync state management
let syncListeners: ((status: SyncStatus) => void)[] = []
let currentSyncStatus: SyncStatus = {
  totalPending: 0,
  isSyncing: false,
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  syncListeners.push(listener)
  listener(currentSyncStatus)
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener)
  }
}

function notifySyncListeners() {
  syncListeners.forEach((listener) => listener(currentSyncStatus))
}

async function updateSyncStatus() {
  try {
    const pendingPhotos = await getPendingPhotos()
    const folders = await getFolders()
    const pendingFolders = folders.filter(f => f.syncStatus === "pending")
    
    const v = await getVillages()
    const sv = await getSubVillages()
    const h = await getHouses()
    
    const pendingHierarchy = [
      ...v.filter(i => i.syncStatus === "pending"),
      ...sv.filter(i => i.syncStatus === "pending"),
      ...h.filter(i => i.syncStatus === "pending")
    ]
    
    currentSyncStatus.totalPending = pendingPhotos.length + pendingFolders.length + pendingHierarchy.length
    notifySyncListeners()
  } catch (error) {
    console.error('[SyncManager] Error updating sync status:', error)
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  await updateSyncStatus()
  return currentSyncStatus
}

// Define PendingPhoto interface since it's not exported
export interface PendingPhoto {
  id: string
  entryId: string
  folderId: string
  fileName?: string
  blob: Blob
  mimeType?: string
  syncStatus: "pending" | "syncing" | "synced" | "failed"
  syncAttempts: number
  createdAt?: number
}

// Helper function untuk update photo sync attempts
async function updatePhotoSyncAttempts(id: string, attempts: number): Promise<void> {
  try {
    const database = await import('./indexeddb').then(m => m.initDB())
    return new Promise((resolve, reject) => {
      const tx = database.transaction(['photos'], 'readwrite')
      const store = tx.objectStore('photos')

      // Get photo first
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const photo = getRequest.result
        if (photo) {
          photo.syncAttempts = attempts
          const updateRequest = store.put(photo)

          updateRequest.onerror = () => {
            console.error(`[IndexedDB] Error updating photo attempts:`, updateRequest.error)
            reject(updateRequest.error)
          }
          updateRequest.onsuccess = () => {
            console.log(`[IndexedDB] Photo attempts updated: ${id} -> ${attempts}`)
            resolve()
          }
        } else {
          reject(new Error('Photo not found'))
        }
      }

      getRequest.onerror = () => {
        console.error(`[IndexedDB] Error getting photo for attempts update:`, getRequest.error)
        reject(getRequest.error)
      }
    })
  } catch (error) {
    console.error(`[IndexedDB] Failed to update photo attempts:`, error)
    throw error
  }
}

let isSyncing = false

/**
 * Sync single photo to server
 */
export async function syncPhoto(photo: PendingPhoto): Promise<boolean> {
  console.group('🔄 SYNC PHOTO:', photo.id)
  console.log('Photo details:', {
    id: photo.id,
    entryId: photo.entryId,
    folderId: photo.folderId,
    fileName: photo.fileName,
    blobSize: photo.blob?.size,
    mimeType: photo.mimeType,
    syncStatus: photo.syncStatus,
    syncAttempts: photo.syncAttempts,
  })

  try {
    // Validate blob
    if (!photo.blob) {
      console.error('❌ No blob found for photo:', photo.id)
      await updatePhotoStatus(photo.id, 'failed')
      console.groupEnd()
      return false
    }

    console.log('📤 Step 1/3: Creating FormData...')
    const formData = new FormData()
    formData.append('file', photo.blob, photo.fileName || `photo-${photo.id}.jpg`)
    formData.append('photoId', photo.id)
    formData.append('folderId', photo.folderId || '')
    
    // Get metadata for additional fields
    const { getMetadata } = await import('./indexeddb')
    const metadata = await getMetadata(photo.id)
    
    if (metadata) {
      formData.append('location', metadata.location || '')
      formData.append('description', metadata.description || '')
      formData.append('timestamp', metadata.timestamp?.toString() || Date.now().toString())
      formData.append('villageId', metadata.villageId?.toString() || '')
      formData.append('subVillageId', metadata.subVillageId?.toString() || '')
      formData.append('houseId', metadata.houseId?.toString() || '')
    }

    console.log('📤 Step 2/3: Uploading file to /api/upload...')
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    console.log('Upload response status:', uploadRes.status, uploadRes.statusText)

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      console.error('❌ Upload failed:', {
        status: uploadRes.status,
        statusText: uploadRes.statusText,
        error: errorText,
      })
      throw new Error(`Upload failed: ${uploadRes.status} - ${errorText}`)
    }

    const uploadData = await uploadRes.json()
    console.log('✅ File uploaded successfully:', {
      url: uploadData.url,
      publicId: uploadData.publicId,
    })

    console.log('📝 Step 3/3: Creating entry...')
    const entryRes = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: photo.entryId,
        folderId: photo.folderId,
      }),
    })

    console.log('Entry response status:', entryRes.status, entryRes.statusText)

    if (!entryRes.ok) {
      const errorText = await entryRes.text()
      console.error('❌ Entry creation failed:', {
        status: entryRes.status,
        statusText: entryRes.statusText,
        error: errorText,
      })
      throw new Error(`Entry creation failed: ${entryRes.status} - ${errorText}`)
    }

    const entryData = await entryRes.json()
    console.log('✅ Entry created:', entryData)

    console.log('🔗 Step 4/3: Linking photo to entry...')
    const linkRes = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: uploadData.url,
        publicId: uploadData.publicId,
        entryId: photo.entryId,
      }),
    })

    console.log('Link response status:', linkRes.status, linkRes.statusText)

    if (!linkRes.ok) {
      const errorText = await linkRes.text()
      console.error('❌ Photo linking failed:', {
        status: linkRes.status,
        statusText: linkRes.statusText,
        error: errorText,
      })
      throw new Error(`Photo linking failed: ${linkRes.status} - ${errorText}`)
    }

    const linkData = await linkRes.json()
    console.log('✅ Photo linked successfully:', linkData)

    // ⭐ CRITICAL: Update sync status to 'synced'
    console.log('📝 Updating sync status to "synced"...')
    await updatePhotoStatus(photo.id, 'synced')
    console.log('✅ Sync status updated to "synced"')

    // ⭐ TRIGGER UI REFRESH
    if (typeof window !== 'undefined') {
      console.log('📢 Dispatching "photo-synced" event for UI refresh...')
      window.dispatchEvent(
        new CustomEvent('photo-synced', {
          detail: { photoId: photo.id, entryId: photo.entryId },
        })
      )
    }

    console.log('✅✅✅ PHOTO SYNC COMPLETE ✅✅✅')
    console.groupEnd()
    return true
  } catch (error) {
    console.error('❌ Sync error:', error)
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    })

    await updatePhotoStatus(photo.id, 'failed')
    console.log('📝 Sync status updated to "failed"')
    console.groupEnd()
    return false
  }
}

/**
 * Start syncing all pending photos
 */
export async function startSync(): Promise<void> {
  console.group('🚀 START SYNC MANAGER')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Online status:', navigator.onLine)

  if (isSyncing) {
    console.log('⏸️ Already syncing, skipping...')
    console.groupEnd()
    return
  }

  isSyncing = true
  currentSyncStatus.isSyncing = true
  notifySyncListeners()
  console.log('🔒 Sync lock acquired')

  try {
    // 0. Sync Hierarchy first (Villages, SubVillages, Houses, Folders)
    console.log('🏗️ Syncing hierarchy data...')
    
    // Sync Villages
    const allVillages = await getVillages()
    const pendingVillages = allVillages.filter(i => i.syncStatus === "pending")
    console.log(`📊 Found ${pendingVillages.length} pending villages`)
    for (const v of pendingVillages) {
      try {
        console.log(`🔄 Syncing village: ${v.name} (${v.id})`)
        const res = await fetch("/api/villages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: v.name, offlineId: v.id })
        })
        if (res.ok) {
          await saveVillage({ ...v, syncStatus: "synced" })
          console.log('✅ Village synced:', v.name)
        } else {
          console.error('❌ Village sync failed:', v.name, res.status)
        }
      } catch (e) {
        console.error('❌ Village sync failed:', v.name, e)
      }
    }

    // Sync SubVillages
    const allSubVillages = await getSubVillages()
    const pendingSubVillages = allSubVillages.filter(i => i.syncStatus === "pending")
    console.log(`📊 Found ${pendingSubVillages.length} pending sub-villages`)
    for (const sv of pendingSubVillages) {
      try {
        console.log(`🔄 Syncing sub-village: ${sv.name} (${sv.id})`)
        let villageId = sv.villageId
        if (typeof villageId === 'string') {
          if (villageId.startsWith('v_')) {
            console.warn('⚠️ Skipping sub-village with offline villageId:', sv.id, villageId)
            await saveSubVillage({ ...sv, syncStatus: "synced" })
            continue
          }
          const parsed = parseInt(villageId, 10)
          if (!isNaN(parsed)) villageId = parsed
        }
        
        const res = await fetch("/api/sub-villages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: sv.name, 
            villageId, 
            offlineId: sv.id 
          })
        })
        if (res.ok) {
          await saveSubVillage({ ...sv, syncStatus: "synced" })
          console.log('✅ Sub-village synced:', sv.name)
        } else {
          console.error('❌ Sub-village sync failed:', sv.name, res.status)
        }
      } catch (e) {
        console.error('❌ Sub-village sync failed:', sv.name, e)
      }
    }

    // Sync Houses
    const allHouses = await getHouses()
    const pendingHouses = allHouses.filter(i => i.syncStatus === "pending")
    console.log(`📊 Found ${pendingHouses.length} pending houses`)
    for (const h of pendingHouses) {
      try {
        console.log(`🔄 Syncing house: ${h.ownerName} (${h.id})`)
        let subVillageId = h.subVillageId
        if (typeof subVillageId === 'string') {
          if (subVillageId.startsWith('sv_')) {
            console.warn('⚠️ Skipping house with offline subVillageId:', h.id, subVillageId)
            await saveHouse({ ...h, syncStatus: "synced" })
            continue
          }
          const parsed = parseInt(subVillageId, 10)
          if (!isNaN(parsed)) subVillageId = parsed
        }
        
        const res = await fetch("/api/houses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ownerName: h.ownerName,
            nik: h.nik,
            address: h.address,
            subVillageId,
            offlineId: h.id
          })
        })
        if (res.ok) {
          await saveHouse({ ...h, syncStatus: "synced" })
          console.log('✅ House synced:', h.ownerName)
        } else {
          console.error('❌ House sync failed:', h.ownerName, res.status)
        }
      } catch (e) {
        console.error('❌ House sync failed:', h.ownerName, e)
      }
    }

    // Sync Folders
    const allFolders = await getFolders()
    const pendingFolders = allFolders.filter(f => f.syncStatus === "pending")
    console.log(`📊 Found ${pendingFolders.length} pending folders`)
    for (const folder of pendingFolders) {
      try {
        console.log(`🔄 Syncing folder: ${folder.name} (${folder.id})`)
        let villageId = folder.villageId
        let subVillageId = folder.subVillageId
        let houseId = folder.houseId
        
        // Convert to numbers if needed
        if (villageId && typeof villageId === 'string' && !villageId.startsWith('v_')) {
          const parsed = parseInt(villageId, 10)
          if (!isNaN(parsed)) villageId = parsed
        }
        if (subVillageId && typeof subVillageId === 'string' && !subVillageId.startsWith('sv_')) {
          const parsed = parseInt(subVillageId, 10)
          if (!isNaN(parsed)) subVillageId = parsed
        }
        if (houseId && typeof houseId === 'string' && !houseId.startsWith('h_')) {
          const parsed = parseInt(houseId, 10)
          if (!isNaN(parsed)) houseId = parsed
        }
        
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: folder.name,
            houseName: folder.houseName,
            nik: folder.nik,
            villageId: villageId || null,
            subVillageId: subVillageId || null,
            houseId: houseId || null,
            offlineId: folder.id
          })
        })
        if (res.ok) {
          await saveFolder({ ...folder, syncStatus: "synced" })
          console.log('✅ Folder synced:', folder.name)
        } else {
          console.error('❌ Folder sync failed:', folder.name, res.status)
        }
      } catch (e) {
        console.error('❌ Folder sync failed:', folder.name, e)
      }
    }

    console.log('� Getting pending photos from IndexedDB...')
    const pendingPhotos = await getPendingPhotos()
    console.log('📊 Pending photos count:', pendingPhotos.length)

    if (pendingPhotos.length === 0) {
      console.log('✅ No pending photos to sync')
      console.groupEnd()
      return
    }

    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < pendingPhotos.length; i++) {
      const photo = pendingPhotos[i]
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📷 Processing photo ${i + 1}/${pendingPhotos.length}`)
      console.log(`ID: ${photo.id}`)
      console.log(`Attempt: ${photo.syncAttempts + 1}/3`)
      console.log(`${'='.repeat(60)}\n`)

      const success = await syncPhoto(photo)

      if (success) {
        successCount++
        console.log(`✅ Photo ${i + 1}/${pendingPhotos.length} synced successfully`)
      } else {
        failedCount++

        // Update attempt count
        if (photo.syncAttempts < 2) {
          const newAttempts = photo.syncAttempts + 1
          console.log(`⏱️ Will retry later (attempt ${newAttempts}/3)`)
          await updatePhotoSyncAttempts(photo.id, newAttempts)
        } else {
          console.error(`❌ Max retries (3) reached for photo ${photo.id}`)
          console.error('Photo will remain in "failed" status')
        }
      }

      // Add delay between syncs to avoid rate limiting
      if (i < pendingPhotos.length - 1) {
        console.log('⏳ Waiting 500ms before next photo...')
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SYNC SUMMARY')
    console.log('='.repeat(60))
    console.log('Total photos:', pendingPhotos.length)
    console.log('✅ Success:', successCount)
    console.log('❌ Failed:', failedCount)
    console.log('='.repeat(60))

    // Dispatch event to refresh UI
    if (typeof window !== 'undefined') {
      console.log('📢 Dispatching "sync-completed" event...')
      window.dispatchEvent(
        new CustomEvent('sync-completed', {
          detail: { successCount, failedCount, totalCount: pendingPhotos.length },
        })
      )
    }
  } catch (error) {
    console.error('❌ Fatal sync error:', error)
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  } finally {
    isSyncing = false
    currentSyncStatus.isSyncing = false
    currentSyncStatus.lastSyncTime = new Date()
    notifySyncListeners()
    console.log('🔓 Sync lock released')
    console.log('✅ SYNC MANAGER COMPLETED')
    console.groupEnd()
  }
}

/**
 * Initialize sync manager with auto-sync capabilities
 */
export function initSyncManager() {
  console.log('🔧 ===== INIT SYNC MANAGER =====')
  console.log('Timestamp:', new Date().toISOString())
  console.log('User Agent:', navigator.userAgent)
  console.log('Online:', navigator.onLine)

  if (typeof window === 'undefined') {
    console.log('⏸️ Running on server-side, skipping initialization')
    return
  }

  // ===== ONLINE EVENT LISTENER =====
  const handleOnline = async () => {
    console.log('\n' + '='.repeat(60))
    console.log('🌐 ONLINE EVENT DETECTED')
    console.log('='.repeat(60))
    console.log('Connection restored at:', new Date().toISOString())
    console.log('Waiting 2 seconds before starting sync...')

    setTimeout(async () => {
      console.log('⏰ 2 seconds elapsed, starting sync now...')
      await startSync()
    }, 2000)
  }

  window.addEventListener('online', handleOnline)
  console.log('✅ Online event listener registered')

  // ===== OFFLINE EVENT LISTENER =====
  const handleOffline = () => {
    console.log('\n' + '='.repeat(60))
    console.log('📴 OFFLINE EVENT DETECTED')
    console.log('='.repeat(60))
    console.log('Connection lost at:', new Date().toISOString())
    console.log('Sync will resume automatically when connection returns')
  }

  window.addEventListener('offline', handleOffline)
  console.log('✅ Offline event listener registered')

  // ===== SERVICE WORKER MESSAGE LISTENER =====
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('✅ Service Worker is active, registering message listener...')

    navigator.serviceWorker.addEventListener('message', async (event) => {
      console.log('📨 SERVICE WORKER MESSAGE RECEIVED:', event.data)

      if (event.data && event.data.type === 'BACKGROUND_SYNC_TRIGGERED') {
        console.log('🔄 Background sync triggered by Service Worker')
        console.log('Tag:', event.data.tag)
        console.log('Timestamp:', new Date(event.data.timestamp).toISOString())
        await startSync()
      }
    })

    console.log('✅ Service Worker message listener registered')
  } else {
    console.warn('⚠️ Service Worker not available or not controlling')
  }

  // ===== BACKGROUND SYNC API =====
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    console.log('✅ Background Sync API is supported')

    // Register sync on online event
    const registerBackgroundSync = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('sync-photos')
        console.log('✅ Background sync "sync-photos" registered')
      } catch (error) {
        console.error('❌ Failed to register background sync:', error)
      }
    }

    window.addEventListener('online', registerBackgroundSync)
    console.log('✅ Background sync registration on online event set up')
  } else {
    console.warn('⚠️ Background Sync API not supported')
    console.warn('Falling back to online event listener only')
  }

  // ===== AUTO-SYNC ON PAGE LOAD =====
  console.log('⏰ Setting up auto-sync check in 3 seconds...')

  // Update sync status setiap 5 detik
  setInterval(() => {
    updateSyncStatus()
  }, 5000)

  setTimeout(async () => {
    console.log('\n' + '='.repeat(60))
    console.log('🔍 AUTO-SYNC CHECK ON PAGE LOAD')
    console.log('='.repeat(60))
    console.log('Checking for pending photos...')

    try {
      await updateSyncStatus()
      console.log('Found pending photos:', currentSyncStatus.totalPending)

      if (currentSyncStatus.totalPending > 0) {
        console.log('Online status:', navigator.onLine)

        if (navigator.onLine) {
          console.log('📡 Device is online, starting automatic sync...')
          await startSync()
        } else {
          console.log('📴 Device is offline, sync will wait for connection')
        }
      } else {
        console.log('✅ No pending photos, nothing to sync')
      }
    } catch (error) {
      console.error('❌ Error during auto-sync check:', error)
    }

    console.log('='.repeat(60))
  }, 3000)

  console.log('✅ Auto-sync check scheduled for 3 seconds from now')
  console.log('===== SYNC MANAGER INITIALIZATION COMPLETE =====\n')
}

// ===== EXPORT FOR MANUAL DEBUGGING =====
export function debugSyncManager() {
  return {
    isSyncing,
    navigator: {
      onLine: navigator.onLine,
      userAgent: navigator.userAgent,
    },
    serviceWorker: {
      available: 'serviceWorker' in navigator,
      controller: !!navigator.serviceWorker?.controller,
    },
    backgroundSync: {
      supported: 'sync' in ServiceWorkerRegistration.prototype,
    },
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  ;(window as any).__debugSyncManager = debugSyncManager
  ;(window as any).__startSync = startSync
  ;(window as any).__getPendingPhotos = getPendingPhotos
}
