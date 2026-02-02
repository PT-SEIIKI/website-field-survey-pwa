// Sync manager untuk handle upload queue dan auto-sync
import { getPendingPhotos, updatePhotoStatus, getMetadata, getPhoto, getFolders, saveFolder, saveMetadata } from "./indexeddb"
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
  const folders = await getFolders()
  const pendingFolders = folders.filter(f => f.syncStatus === "pending")
  
  currentSyncStatus.totalPending = pendingPhotos.length + pendingFolders.length
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
    // 0. Fetch from server first to merge with local
    console.log("[v0] Fetching data from server to merge")
    await fetchAndMergeFromServer()

    // 1. Sync Folders first (because entries depend on folderId)
    const allFolders = await getFolders()
    const pendingFolders = allFolders.filter(f => f.syncStatus === "pending")
    
    if (pendingFolders.length > 0) {
      console.log(`[v0] Syncing ${pendingFolders.length} folders`)
      for (const folder of pendingFolders) {
        try {
          await syncFolder(folder)
        } catch (e) {
          console.error(`[v0] Folder sync error for ${folder.id}:`, e)
          // Continue with other folders even if one fails
        }
      }
    }

    // Cache folders to avoid redundant API calls within the same sync batch
    let foldersCache: any[] | null = null;

    // 2. Sync Photos
    const pendingPhotos = await getPendingPhotos()
    console.log(`[v0] Starting sync for ${pendingPhotos.length} photos`)

    for (const photo of pendingPhotos) {
      if (!foldersCache) {
        const foldersRes = await fetch("/api/folders")
        if (foldersRes.ok) foldersCache = await foldersRes.json()
      }
      await syncPhoto(photo, foldersCache)
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

async function syncFolder(folder: any) {
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      // Check if folder already exists on server by offlineId
      const foldersRes = await fetch("/api/folders")
      if (foldersRes.ok) {
        const serverFolders = await foldersRes.json()
        const existingServerFolder = serverFolders.find((f: any) => f.offlineId === folder.id)
        
        if (existingServerFolder) {
          // If exists, update it to ensure names match
          const updateRes = await fetch(`/api/folders/${existingServerFolder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: folder.name,
              houseName: folder.houseName,
              nik: folder.nik
            })
          })
          if (!updateRes.ok) throw new Error("Update failed")
        } else {
          // If not exists, create new
          const response = await fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: folder.name,
              houseName: folder.houseName,
              nik: folder.nik,
              offlineId: folder.id,
              isSynced: true
            })
          })
          if (!response.ok) throw new Error("Folder creation failed")
        }
      } else {
        throw new Error("Failed to fetch folders")
      }

      // Update local status
      await saveFolder({
        ...folder,
        syncStatus: "synced"
      })
      console.log("[v0] Folder synced:", folder.id)
      return // Success
    } catch (error) {
      retryCount++
      console.error(`[v0] Failed to sync folder (attempt ${retryCount}):`, folder.id, error)
      if (retryCount >= maxRetries) throw error
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
    }
  }
}

async function syncPhoto(photo: any, foldersCache: any[] | null = null) {
  const photoId = photo.id;
  try {
    await updatePhotoStatus(photoId, "syncing")
    notifySyncListeners()

    const metadata = await getMetadata(photoId)
    const photoData = await getPhoto(photoId);
    if (!photoData) {
      throw new Error("Photo not found in IndexedDB");
    }

    // First upload the photo file to /api/upload
    const photoFormData = new FormData();
    photoFormData.append("file", photoData.blob, `${photoId}.jpg`);
    photoFormData.append("photoId", photoId);
    photoFormData.append("location", metadata?.location || "");
    photoFormData.append("description", metadata?.description || "");
    photoFormData.append("timestamp", photoData.timestamp.toString());
    
    // Add folder info to upload metadata if exists
    if (metadata?.folderId) {
      photoFormData.append("folderId", metadata.folderId);
    }

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: photoFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${errorText}`);
    }

    // Find server-side folder ID if it exists
    let serverFolderId = null
    if (metadata?.folderId) {
      const folders = foldersCache || await (async () => {
        const res = await fetch("/api/folders")
        return res.ok ? await res.json() : []
      })()
      
      const folder = folders.find((f: any) => f.offlineId === metadata.folderId)
      if (folder) serverFolderId = folder.id
    }

    // New hierarchy support:
    const serverHouseId = metadata?.houseId;
    
    const response = await fetch("/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surveyId: metadata?.surveyId || 1,
        folderId: serverFolderId,
        data: JSON.stringify({
          description: metadata?.description,
          location: metadata?.location,
          timestamp: photoData.timestamp,
          folderId: metadata?.folderId,
          villageId: metadata?.villageId,
          subVillageId: metadata?.subVillageId,
          houseId: metadata?.houseId
        }),
        offlineId: photoId,
        isSynced: true
      }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const entryData = await response.json();

    // Now upload photo linked to this entry AND the house directly
    const photoResponse = await fetch("/api/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entryId: entryData.id,
        houseId: serverHouseId,
        url: `/uploads/${photoId}.jpg`,
        offlineId: photoId
      }),
    });

    if (!photoResponse.ok) {
      throw new Error(`Photo upload failed: ${photoResponse.statusText}`)
    }

    await updatePhotoStatus(photoId, "synced")
    console.log("[v0] Photo synced:", photoId)
  } catch (error) {
    console.error("[v0] Failed to sync photo:", photoId, error)
    await updatePhotoStatus(photoId, "failed")
    throw error
  }
}

async function fetchAndMergeFromServer() {
  const isOnline = await checkConnectivity()
  if (!isOnline) {
    console.log("[v0] Offline - skipping merge from server")
    return
  }

  try {
    // Get current survey ID (usually 1 for this app)
    const surveyId = 1;

    // Fetch Folders
    const foldersRes = await fetch("/api/folders")
    if (foldersRes.ok) {
      const serverFolders = await foldersRes.json()
      const localFolders = await getFolders()
      
      for (const sFolder of serverFolders) {
        // Match by offlineId (if it was created locally first) or by server id
        const local = localFolders.find(f => f.id === sFolder.offlineId || f.id === sFolder.id.toString())
        if (!local) {
          await saveFolder({
            id: sFolder.offlineId || sFolder.id.toString(),
            name: sFolder.name,
            houseName: sFolder.houseName,
            nik: sFolder.nik,
            createdAt: new Date(sFolder.createdAt).getTime(),
            syncStatus: "synced"
          })
        }
      }
    }

    // Fetch Entries to get photo metadata
    const entriesRes = await fetch(`/api/entries?surveyId=${surveyId}`)
    if (entriesRes.ok) {
      const data = await entriesRes.json()
      const serverEntries = data.entries || []
      
      for (const entry of serverEntries) {
        // Check if we have photos for this entry
        const photosRes = await fetch(`/api/photos/list?entryId=${entry.id}`)
        if (photosRes.ok) {
          const photos = await photosRes.json()
          for (const photo of photos) {
            // Check if photo exists in local metadata
            const localMeta = await getMetadata(photo.offlineId || photo.id.toString())
            if (!localMeta) {
              // Parse entry data for location/description
              let entryData: any = {}
              try {
                entryData = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data
              } catch (e) {}

              const photoId = photo.offlineId || photo.id.toString()
              
              // Save metadata so it appears in UI
              await saveMetadata(photoId, {
                location: entryData?.location || "",
                description: entryData?.description || "",
                timestamp: entryData?.timestamp || new Date(entry.createdAt).getTime(),
              })

              // Mark photo as synced in local DB if not present
              const localPhoto = await getPhoto(photoId)
              if (!localPhoto) {
                // We don't have the blob, but we mark it synced so we don't try to upload it
                // The UI will use the server URL if the blob is missing
                await (await import("./indexeddb")).savePhoto({
                  id: photoId,
                  blob: new Blob(), // Empty blob as placeholder
                  timestamp: entryData?.timestamp || new Date(entry.createdAt).getTime(),
                  syncStatus: "synced"
                })
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("[v0] Merge error:", e)
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
