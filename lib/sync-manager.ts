// Sync manager untuk handle upload queue dan auto-sync
import { getPendingPhotos, updatePhotoStatus, getMetadata } from "./indexeddb"
import { checkConnectivity, subscribeToConnectivity } from "./connectivity"

export interface SyncStatus {
  totalPending: number
  isSyncing: boolean
  lastSyncTime?: number
  lastError?: string
}

let syncInProgress = false
let syncListeners: ((status: SyncStatus) => void)[] = []
const currentSyncStatus: SyncStatus = {
  totalPending: 0,
  isSyncing: false,
}

export function initSyncManager() {
  // Subscribe ke connectivity changes
  subscribeToConnectivity((isOnline) => {
    if (isOnline && !syncInProgress) {
      console.log("[v0] Online - starting sync")
      startSync()
    }
  })

  // Cek sync queue setiap 5 detik
  setInterval(() => {
    updateSyncStatus()
  }, 5000)
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  syncListeners.push(listener)

  // Immediately call with current status
  listener(currentSyncStatus)

  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener)
  }
}

function notifySyncListeners() {
  syncListeners.forEach((listener) => listener(currentSyncStatus))
}

async function updateSyncStatus() {
  const pendingPhotos = await getPendingPhotos()
  currentSyncStatus.totalPending = pendingPhotos.length
  notifySyncListeners()
}

export async function startSync() {
  if (syncInProgress) {
    console.log("[v0] Sync already in progress")
    return
  }

  const isOnline = await checkConnectivity()
  if (!isOnline) {
    console.log("[v0] Offline - cannot sync")
    return
  }

  syncInProgress = true
  currentSyncStatus.isSyncing = true
  notifySyncListeners()

  try {
    const pendingPhotos = await getPendingPhotos()
    console.log(`[v0] Starting sync for ${pendingPhotos.length} photos`)

    for (const photo of pendingPhotos) {
      await syncPhoto(photo)
    }

    currentSyncStatus.lastSyncTime = Date.now()
    currentSyncStatus.lastError = undefined
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Sync error:", errorMsg)
    currentSyncStatus.lastError = errorMsg
  } finally {
    syncInProgress = false
    currentSyncStatus.isSyncing = false
    await updateSyncStatus()
    notifySyncListeners()
  }
}

async function syncPhoto(photo: any) {
  try {
    await updatePhotoStatus(photo.id, "syncing")
    notifySyncListeners()

    const metadata = await getMetadata(photo.id)

    const response = await fetch("/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surveyId: metadata?.surveyId || 1, // Default or from metadata
        data: JSON.stringify({
          description: metadata?.description,
          location: metadata?.location,
          timestamp: photo.timestamp
        }),
        offlineId: photo.id,
        isSynced: true
      }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const entryData = await response.json();

    // Now upload photo linked to this entry
    const photoResponse = await fetch("/api/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entryId: entryData.id,
        url: `/uploads/${photo.id}.jpg`, // Corrected to use the configured upload directory
        offlineId: photo.id
      }),
    });

    if (!photoResponse.ok) {
      throw new Error(`Photo upload failed: ${photoResponse.statusText}`)
    }

    await updatePhotoStatus(photo.id, "synced")
    console.log("[v0] Photo synced:", photo.id)
  } catch (error) {
    console.error("[v0] Failed to sync photo:", photo.id, error)
    await updatePhotoStatus(photo.id, "failed")
    throw error
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  await updateSyncStatus()
  return currentSyncStatus
}

export async function retryFailedSync() {
  const database = await (await import("./indexeddb")).initDB()
  const failedPhotos: any[] = await new Promise((resolve, reject) => {
    const tx = database.transaction(["photos"], "readonly")
    const store = tx.objectStore("photos")
    const index = store.index("syncStatus")
    const request = index.getAll("failed")

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })

  if (failedPhotos.length > 0) {
    console.log(`[v0] Retrying ${failedPhotos.length} failed photos`)
    await startSync()
  }
}
