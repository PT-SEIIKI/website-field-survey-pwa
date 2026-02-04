// Offline Sync Queue untuk menangani operasi CRUD saat offline
interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'village' | 'subVillage' | 'house' | 'folder'
  data?: any
  entityId?: string
  timestamp: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  retryCount?: number
}

class OfflineSyncQueue {
  private queue: SyncOperation[] = []
  private isProcessing = false

  async addToQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${operation.entity}_${operation.entityId}_${Date.now()}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    }

    // Simpan ke IndexedDB
    await this.saveToIndexedDB(syncOp)
    this.queue.push(syncOp)
    
    // Coba sync jika online
    if (navigator.onLine) {
      this.processQueue()
    }
  }

  async saveToIndexedDB(operation: SyncOperation): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['syncQueue'], 'readwrite')
      const store = tx.objectStore('syncQueue')
      const request = store.put(operation)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadFromIndexedDB(): Promise<void> {
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['syncQueue'], 'readonly')
      const store = tx.objectStore('syncQueue')
      const request = store.getAll()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.queue = request.result || []
        resolve()
      }
    })
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SurveyOfflineDB', 5) // Update ke versi 5
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return
    
    // Cek koneksi sebenarnya ke server
    const hasRealConnection = await this.checkRealConnection()
    if (!hasRealConnection) {
      console.log('[SyncQueue] No real connection to server, skipping sync')
      return
    }
    
    this.isProcessing = true
    const pendingOps = this.queue.filter(op => op.status === 'pending')
    
    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing'
        await this.saveToIndexedDB(operation)
        
        await this.executeOperation(operation)
        operation.status = 'completed'
        await this.saveToIndexedDB(operation)
        
        console.log('[SyncQueue] Operation completed:', operation.id)
      } catch (error) {
        console.error('[SyncQueue] Operation failed:', error)
        operation.status = 'failed'
        operation.retryCount = (operation.retryCount || 0) + 1
        await this.saveToIndexedDB(operation)
        
        // Retry logic dengan exponential backoff
        if (operation.retryCount < 5) {
          const delay = Math.min(30000, 5000 * Math.pow(2, operation.retryCount - 1))
          console.log(`[SyncQueue] Retrying operation ${operation.id} in ${delay}ms (attempt ${operation.retryCount}/5)`)
          
          setTimeout(() => {
            operation.status = 'pending'
            this.saveToIndexedDB(operation)
            this.processQueue()
          }, delay)
        } else {
          console.error(`[SyncQueue] Operation ${operation.id} failed after 5 retries, giving up`)
        }
      }
    }
    
    this.isProcessing = false
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    const { type, entity, data, entityId } = operation
    
    switch (entity) {
      case 'village':
        await this.executeVillageOperation(type, data, entityId)
        break
      case 'subVillage':
        await this.executeSubVillageOperation(type, data, entityId)
        break
      case 'house':
        await this.executeHouseOperation(type, data, entityId)
        break
      case 'folder':
        await this.executeFolderOperation(type, data, entityId)
        break
    }
  }

  private async executeVillageOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        const response = await fetch('/api/villages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) {
          throw new Error(`Village creation failed: ${response.status} ${response.statusText}`)
        }
        break
      case 'update':
        const updateResponse = await fetch(`/api/villages/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!updateResponse.ok) {
          throw new Error(`Village update failed: ${updateResponse.status} ${updateResponse.statusText}`)
        }
        break
      case 'delete':
        const deleteResponse = await fetch(`/api/villages/${entityId}`, {
          method: 'DELETE'
        })
        if (!deleteResponse.ok) {
          throw new Error(`Village deletion failed: ${deleteResponse.status} ${deleteResponse.statusText}`)
        }
        break
    }
  }

  private async executeSubVillageOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        const response = await fetch('/api/sub-villages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) {
          throw new Error(`SubVillage creation failed: ${response.status} ${response.statusText}`)
        }
        break
      case 'update':
        const updateResponse = await fetch(`/api/sub-villages/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!updateResponse.ok) {
          throw new Error(`SubVillage update failed: ${updateResponse.status} ${updateResponse.statusText}`)
        }
        break
      case 'delete':
        const deleteResponse = await fetch(`/api/sub-villages/${entityId}`, {
          method: 'DELETE'
        })
        if (!deleteResponse.ok) {
          throw new Error(`SubVillage deletion failed: ${deleteResponse.status} ${deleteResponse.statusText}`)
        }
        break
    }
  }

  private async executeHouseOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        const response = await fetch('/api/houses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) {
          throw new Error(`House creation failed: ${response.status} ${response.statusText}`)
        }
        break
      case 'update':
        const updateResponse = await fetch(`/api/houses/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!updateResponse.ok) {
          throw new Error(`House update failed: ${updateResponse.status} ${updateResponse.statusText}`)
        }
        break
      case 'delete':
        const deleteResponse = await fetch(`/api/houses/${entityId}`, {
          method: 'DELETE'
        })
        if (!deleteResponse.ok) {
          throw new Error(`House deletion failed: ${deleteResponse.status} ${deleteResponse.statusText}`)
        }
        break
    }
  }

  private async executeFolderOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!response.ok) {
          throw new Error(`Folder creation failed: ${response.status} ${response.statusText}`)
        }
        break
      case 'update':
        const updateResponse = await fetch(`/api/folders/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!updateResponse.ok) {
          throw new Error(`Folder update failed: ${updateResponse.status} ${updateResponse.statusText}`)
        }
        break
      case 'delete':
        const deleteResponse = await fetch(`/api/folders/${entityId}`, {
          method: 'DELETE'
        })
        if (!deleteResponse.ok) {
          throw new Error(`Folder deletion failed: ${deleteResponse.status} ${deleteResponse.statusText}`)
        }
        break
    }
  }

  getPendingCount(): number {
    return this.queue.filter(op => op.status === 'pending').length
  }

  getFailedCount(): number {
    return this.queue.filter(op => op.status === 'failed').length
  }

  async clearCompleted(): Promise<void> {
    this.queue = this.queue.filter(op => op.status !== 'completed')
    const db = await this.openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['syncQueue'], 'readwrite')
      const store = tx.objectStore('syncQueue')
      
      // Hapus yang completed
      const request = store.openCursor()
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.status === 'completed') {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  private async checkRealConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD', 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch (error) {
      console.log('[SyncQueue] Health check failed:', error)
      return false
    }
  }

  async forceRetryFailed(): Promise<void> {
    const failedOps = this.queue.filter(op => op.status === 'failed')
    for (const operation of failedOps) {
      operation.status = 'pending'
      operation.retryCount = 0
      await this.saveToIndexedDB(operation)
    }
    
    if (failedOps.length > 0) {
      console.log(`[SyncQueue] Reset ${failedOps.length} failed operations to pending`)
      this.processQueue()
    }
  }
}

export const offlineSyncQueue = new OfflineSyncQueue()

// Auto-sync saat online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineSyncQueue.processQueue()
  })
}

// Load queue saat aplikasi dimulai
if (typeof window !== 'undefined') {
  offlineSyncQueue.loadFromIndexedDB()
}
