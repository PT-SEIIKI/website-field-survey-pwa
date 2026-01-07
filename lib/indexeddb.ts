// IndexedDB utilities untuk offline storage
const DB_NAME = "SurveyOfflineDB"
const DB_VERSION = 1
const STORES = {
  PHOTOS: "photos",
  SYNC_QUEUE: "syncQueue",
  METADATA: "metadata",
} as const

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store untuk menyimpan photo blobs
      if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: "id" })
        photoStore.createIndex("timestamp", "timestamp", { unique: false })
        photoStore.createIndex("syncStatus", "syncStatus", { unique: false })
      }

      // Store untuk sync queue
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id", autoIncrement: true })
        queueStore.createIndex("photoId", "photoId", { unique: false })
        queueStore.createIndex("status", "status", { unique: false })
      }

      // Store untuk metadata foto
      if (!database.objectStoreNames.contains(STORES.METADATA)) {
        const metaStore = database.createObjectStore(STORES.METADATA, { keyPath: "photoId" })
        metaStore.createIndex("location", "location", { unique: false })
        metaStore.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

export async function savePhoto(photo: {
  id: string
  blob: Blob
  timestamp: number
  syncStatus: "pending" | "syncing" | "synced" | "failed"
}): Promise<string> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS], "readwrite")
    const store = tx.objectStore(STORES.PHOTOS)
    const request = store.put(photo)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log("[v0] Photo saved:", photo.id)
      resolve(photo.id)
    }
  })
}

export async function getPhoto(id: string): Promise<any | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS], "readonly")
    const store = tx.objectStore(STORES.PHOTOS)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function getPendingPhotos(): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS], "readonly")
    const store = tx.objectStore(STORES.PHOTOS)
    const index = store.index("syncStatus")
    const request = index.getAll("pending")

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function updatePhotoStatus(
  id: string,
  status: "pending" | "syncing" | "synced" | "failed",
): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS], "readwrite")
    const store = tx.objectStore(STORES.PHOTOS)

    // Dapatkan photo terlebih dahulu
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const photo = getRequest.result
      if (photo) {
        photo.syncStatus = status
        const updateRequest = store.put(photo)

        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => {
          console.log("[v0] Photo status updated:", id, status)
          resolve()
        }
      } else {
        reject(new Error("Photo not found"))
      }
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function addToSyncQueue(photoId: string): Promise<number> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SYNC_QUEUE], "readwrite")
    const store = tx.objectStore(STORES.SYNC_QUEUE)
    const request = store.add({
      photoId,
      status: "pending",
      createdAt: Date.now(),
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log("[v0] Added to sync queue:", photoId)
      resolve(request.result as number)
    }
  })
}

export async function getSyncQueue(): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SYNC_QUEUE], "readonly")
    const store = tx.objectStore(STORES.SYNC_QUEUE)
    const index = store.index("status")
    const request = index.getAll("pending")

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function updateQueueItemStatus(id: number, status: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SYNC_QUEUE], "readwrite")
    const store = tx.objectStore(STORES.SYNC_QUEUE)

    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const item = getRequest.result
      if (item) {
        item.status = status
        const updateRequest = store.put(item)

        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => resolve()
      } else {
        reject(new Error("Queue item not found"))
      }
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function saveMetadata(
  photoId: string,
  metadata: {
    location?: string
    description?: string
    timestamp?: number
  },
): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.METADATA], "readwrite")
    const store = tx.objectStore(STORES.METADATA)
    const request = store.put({
      photoId,
      ...metadata,
      savedAt: Date.now(),
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log("[v0] Metadata saved for photo:", photoId)
      resolve()
    }
  })
}

export async function getMetadata(photoId: string): Promise<any | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.METADATA], "readonly")
    const store = tx.objectStore(STORES.METADATA)
    const request = store.get(photoId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function getAllPhotos(): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS], "readonly")
    const store = tx.objectStore(STORES.PHOTOS)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deletePhoto(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS, STORES.METADATA], "readwrite")

    const photoStore = tx.objectStore(STORES.PHOTOS)
    const photoRequest = photoStore.delete(id)

    const metaStore = tx.objectStore(STORES.METADATA)
    const metaRequest = metaStore.delete(id)

    photoRequest.onerror = () => reject(photoRequest.error)
    metaRequest.onerror = () => reject(metaRequest.error)

    tx.oncomplete = () => {
      console.log("[v0] Photo deleted:", id)
      resolve()
    }
  })
}

export async function clearAllPhotos(): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS, STORES.METADATA, STORES.SYNC_QUEUE], "readwrite")

    tx.objectStore(STORES.PHOTOS).clear()
    tx.objectStore(STORES.METADATA).clear()
    tx.objectStore(STORES.SYNC_QUEUE).clear()

    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      console.log("[v0] All data cleared")
      resolve()
    }
  })
}
