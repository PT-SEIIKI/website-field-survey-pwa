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
      const request = indexedDB.open('SurveyOfflineDB', 3) // Update to version 3
      
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
    
    this.isProcessing = true
    const pendingOps = this.queue.filter(op => op.status === 'pending')
    
    for (const operation of pendingOps) {
      try {
        await this.executeOperation(operation)
        operation.status = 'completed'
        await this.saveToIndexedDB(operation)
      } catch (error) {
        console.error('[SyncQueue] Operation failed:', error)
        operation.status = 'failed'
        operation.retryCount = (operation.retryCount || 0) + 1
        await this.saveToIndexedDB(operation)
        
        // Retry logic
        if (operation.retryCount < 3) {
          setTimeout(() => {
            operation.status = 'pending'
            this.saveToIndexedDB(operation)
            this.processQueue()
          }, 5000 * operation.retryCount)
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
        await fetch('/api/villages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`/api/villages/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'delete':
        await fetch(`/api/villages/${entityId}`, {
          method: 'DELETE'
        })
        break
    }
  }

  private async executeSubVillageOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        await fetch('/api/sub-villages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`/api/sub-villages/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'delete':
        await fetch(`/api/sub-villages/${entityId}`, {
          method: 'DELETE'
        })
        break
    }
  }

  private async executeHouseOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        await fetch('/api/houses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`/api/houses/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'delete':
        await fetch(`/api/houses/${entityId}`, {
          method: 'DELETE'
        })
        break
    }
  }

  private async executeFolderOperation(type: string, data: any, entityId?: string): Promise<void> {
    switch (type) {
      case 'create':
        await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`/api/folders/${entityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'delete':
        await fetch(`/api/folders/${entityId}`, {
          method: 'DELETE'
        })
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
