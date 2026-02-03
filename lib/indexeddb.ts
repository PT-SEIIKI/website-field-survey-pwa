// IndexedDB utilities untuk offline storage
const DB_NAME = "SurveyOfflineDB"
const DB_VERSION = 5 // Versi baru untuk reset total database
const STORES = {
  PHOTOS: "photos",
  SYNC_QUEUE: "syncQueue",
  METADATA: "metadata",
  FOLDERS: "folders",
  VILLAGES: "villages",
  SUB_VILLAGES: "subVillages",
  HOUSES: "houses",
} as const

let db: IDBDatabase | null = null

// Fungsi untuk menghapus seluruh database
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase(DB_NAME)
    
    deleteReq.onerror = () => reject(deleteReq.error)
    deleteReq.onsuccess = () => {
      console.log(`[IndexedDB] Database ${DB_NAME} berhasil dihapus`)
      db = null // Reset instance
      resolve()
    }
    
    deleteReq.onblocked = () => {
      console.log(`[IndexedDB] Database ${DB_NAME} diblokir, menunggu penutupan koneksi...`)
    }
  })
}

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error(`[IndexedDB] Error membuka database:`, request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      db = request.result
      console.log(`[IndexedDB] Database berhasil dibuka dengan versi ${DB_VERSION}`)
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      console.log(`[IndexedDB] Upgrade dari versi ${event.oldVersion} ke ${DB_VERSION}`)
      
      // HAPUS SEMUA OBJECT STORE YANG ADA untuk reset total
      if (event.oldVersion > 0) {
        const storeNames = Array.from(database.objectStoreNames)
        console.log(`[IndexedDB] Menghapus ${storeNames.length} object store lama:`, storeNames)
        
        storeNames.forEach(storeName => {
          try {
            database.deleteObjectStore(storeName)
            console.log(`[IndexedDB] Store "${storeName}" dihapus`)
          } catch (error) {
            console.warn(`[IndexedDB] Gagal menghapus store "${storeName}":`, error)
          }
        })
      }

      // BUAT SEMUA OBJECT STORE BARU dari awal
      console.log(`[IndexedDB] Membuat ${Object.keys(STORES).length} object store baru...`)
      
      // Store untuk photos
      try {
        const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: "id" })
        photoStore.createIndex("timestamp", "timestamp", { unique: false })
        photoStore.createIndex("syncStatus", "syncStatus", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.PHOTOS}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.PHOTOS}" sudah ada:`, error)
      }

      // Store untuk sync queue
      try {
        const queueStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id", autoIncrement: true })
        queueStore.createIndex("photoId", "photoId", { unique: false })
        queueStore.createIndex("status", "status", { unique: false })
        queueStore.createIndex("timestamp", "timestamp", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.SYNC_QUEUE}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.SYNC_QUEUE}" sudah ada:`, error)
      }

      // Store untuk metadata
      try {
        const metaStore = database.createObjectStore(STORES.METADATA, { keyPath: "photoId" })
        metaStore.createIndex("location", "location", { unique: false })
        metaStore.createIndex("timestamp", "timestamp", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.METADATA}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.METADATA}" sudah ada:`, error)
      }

      // Store untuk folders
      try {
        const folderStore = database.createObjectStore(STORES.FOLDERS, { keyPath: "id" })
        folderStore.createIndex("syncStatus", "syncStatus", { unique: false })
        folderStore.createIndex("createdAt", "createdAt", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.FOLDERS}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.FOLDERS}" sudah ada:`, error)
      }

      // Store untuk villages
      try {
        const villageStore = database.createObjectStore(STORES.VILLAGES, { keyPath: "id" })
        villageStore.createIndex("syncStatus", "syncStatus", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.VILLAGES}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.VILLAGES}" sudah ada:`, error)
      }

      // Store untuk sub-villages
      try {
        const subVillageStore = database.createObjectStore(STORES.SUB_VILLAGES, { keyPath: "id" })
        subVillageStore.createIndex("villageId", "villageId", { unique: false })
        subVillageStore.createIndex("syncStatus", "syncStatus", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.SUB_VILLAGES}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.SUB_VILLAGES}" sudah ada:`, error)
      }

      // Store untuk houses
      try {
        const houseStore = database.createObjectStore(STORES.HOUSES, { keyPath: "id" })
        houseStore.createIndex("subVillageId", "subVillageId", { unique: false })
        houseStore.createIndex("syncStatus", "syncStatus", { unique: false })
        console.log(`[IndexedDB] Store "${STORES.HOUSES}" dibuat`)
      } catch (error) {
        console.warn(`[IndexedDB] Store "${STORES.HOUSES}" sudah ada:`, error)
      }
      
      console.log(`[IndexedDB] Semua object store berhasil dibuat untuk versi ${DB_VERSION}`)
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
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction([STORES.PHOTOS], "readonly")
      const store = tx.objectStore(STORES.PHOTOS)
      const index = store.index("syncStatus")
      const request = index.getAll("pending")

      request.onerror = () => {
        console.error(`[IndexedDB] Error getting pending photos:`, request.error)
        reject(request.error)
      }
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch (error) {
    console.error(`[IndexedDB] Failed to get pending photos:`, error)
    return []
  }
}

export async function updatePhotoStatus(
  id: string,
  status: "pending" | "syncing" | "synced" | "failed",
): Promise<void> {
  try {
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

          updateRequest.onerror = () => {
            console.error(`[IndexedDB] Error updating photo status:`, updateRequest.error)
            reject(updateRequest.error)
          }
          updateRequest.onsuccess = () => {
            console.log("[v0] Photo status updated:", id, status)
            resolve()
          }
        } else {
          console.warn(`[IndexedDB] Photo with id ${id} not found for status update`)
          resolve() // Resolve instead of reject to prevent app crash
        }
      }

      getRequest.onerror = () => {
        console.error(`[IndexedDB] Error getting photo for status update:`, getRequest.error)
        reject(getRequest.error)
      }
    })
  } catch (error) {
    console.error(`[IndexedDB] Failed to update photo status:`, error)
    // Don't throw error to prevent app crash
  }
}

export async function addToSyncQueue(photoId: string): Promise<number> {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const tx = database.transaction([STORES.SYNC_QUEUE], "readwrite")
      const store = tx.objectStore(STORES.SYNC_QUEUE)
      const request = store.add({
        photoId,
        status: "pending",
        createdAt: Date.now(),
      })

      request.onerror = () => {
        console.error(`[IndexedDB] Error adding to sync queue:`, request.error)
        reject(request.error)
      }
      request.onsuccess = () => {
        console.log("[v0] Added to sync queue:", photoId)
        resolve(request.result as number)
      }
    })
  } catch (error) {
    console.error(`[IndexedDB] Failed to add to sync queue:`, error)
    throw error
  }
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

export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  isLow: boolean;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    // Anggap penyimpanan rendah jika sisa kurang dari 50MB atau penggunaan > 90%
    const isLow = (quota - usage < 50 * 1024 * 1024) || (usage > quota * 0.9);
    return { usage, quota, isLow };
  }
  return { usage: 0, quota: 0, isLow: false };
}

export async function cleanupSyncedPhotos(): Promise<number> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.PHOTOS, STORES.METADATA, STORES.SYNC_QUEUE], "readwrite");
    const photoStore = tx.objectStore(STORES.PHOTOS);
    const metaStore = tx.objectStore(STORES.METADATA);
    const queueStore = tx.objectStore(STORES.SYNC_QUEUE);
    const index = photoStore.index("syncStatus");
    const request = index.getAll("synced");

    let count = 0;
    request.onsuccess = () => {
      const syncedPhotos = request.result;
      syncedPhotos.forEach(photo => {
        photoStore.delete(photo.id);
        metaStore.delete(photo.id);
        // Hapus juga dari queue jika ada
        const queueRequest = queueStore.index("photoId").getAllKeys(photo.id);
        queueRequest.onsuccess = () => {
          queueRequest.result.forEach(key => queueStore.delete(key));
        };
        count++;
      });
    };

    tx.oncomplete = () => {
      console.log(`[v0] Storage cleanup: Deleted ${count} synced photos`);
      resolve(count);
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Folder Operations
export async function saveFolder(folder: {
  id: string
  name: string
  houseName?: string
  nik?: string
  createdAt: number
  syncStatus: "pending" | "synced"
}): Promise<string> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.FOLDERS], "readwrite")
    const store = tx.objectStore(STORES.FOLDERS)
    const request = store.put(folder)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(folder.id)
  })
}

export async function getFolders(): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.FOLDERS], "readonly")
    const store = tx.objectStore(STORES.FOLDERS)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteFolder(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.FOLDERS], "readwrite")
    const store = tx.objectStore(STORES.FOLDERS)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Village Operations
export async function saveVillage(village: any): Promise<string> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.VILLAGES], "readwrite")
    const store = tx.objectStore(STORES.VILLAGES)
    const request = store.put(village)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(village.id)
  })
}

export async function getVillages(): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.VILLAGES], "readonly")
    const store = tx.objectStore(STORES.VILLAGES)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteVillage(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.VILLAGES], "readwrite")
    const store = tx.objectStore(STORES.VILLAGES)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Sub Village Operations
export async function saveSubVillage(subVillage: any): Promise<string> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SUB_VILLAGES], "readwrite")
    const store = tx.objectStore(STORES.SUB_VILLAGES)
    const request = store.put(subVillage)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(subVillage.id)
  })
}

export async function getSubVillages(villageId?: string): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SUB_VILLAGES], "readonly")
    const store = tx.objectStore(STORES.SUB_VILLAGES)
    const request = villageId 
      ? store.index("villageId").getAll(villageId)
      : store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteSubVillage(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.SUB_VILLAGES], "readwrite")
    const store = tx.objectStore(STORES.SUB_VILLAGES)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// House Operations
export async function saveHouse(house: any): Promise<string> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.HOUSES], "readwrite")
    const store = tx.objectStore(STORES.HOUSES)
    const request = store.put(house)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(house.id)
  })
}

export async function getHouses(subVillageId?: string): Promise<any[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.HOUSES], "readonly")
    const store = tx.objectStore(STORES.HOUSES)
    const request = subVillageId
      ? store.index("subVillageId").getAll(subVillageId)
      : store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteHouse(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORES.HOUSES], "readwrite")
    const store = tx.objectStore(STORES.HOUSES)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
