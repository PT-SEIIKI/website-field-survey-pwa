// Photo manager untuk handle local photo operations
import { v4 as uuidv4 } from "uuid"
import { savePhoto, addToSyncQueue, saveMetadata, getAllPhotos, deletePhoto as deletePhotoFromDB } from "./indexeddb"

export interface PhotoData {
  id: string
  blob: Blob
  timestamp: number
  syncStatus: "pending" | "syncing" | "synced" | "failed"
}

export interface PhotoMetadata {
  photoId: string
  location?: string
  description?: string
  timestamp?: number
}

export async function capturePhoto(canvas: HTMLCanvasElement, mimeType = "image/jpeg"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to capture photo from canvas"))
        }
      },
      mimeType,
      0.9,
    )
  })
}

export async function addPhotos(files: File[]): Promise<string[]> {
  const photoIds: string[] = []

  for (const file of files) {
    try {
      const photoId = uuidv4()

      // Save photo blob
      await savePhoto({
        id: photoId,
        blob: file,
        timestamp: Date.now(),
        syncStatus: "pending",
      })

      // Add to sync queue
      await addToSyncQueue(photoId)

      photoIds.push(photoId)
      console.log("[v0] Photo added:", photoId)
    } catch (error) {
      console.error("[v0] Error adding photo:", error)
    }
  }

  return photoIds
}

export async function addPhotoWithMetadata(blob: Blob, metadata?: Partial<PhotoMetadata>): Promise<string | null> {
  try {
    const photoId = uuidv4()

    // Save photo blob
    await savePhoto({
      id: photoId,
      blob,
      timestamp: Date.now(),
      syncStatus: "pending",
    })

    // Save metadata
    if (metadata) {
      await saveMetadata(photoId, metadata)
    }

    // Add to sync queue
    await addToSyncQueue(photoId)

    console.log("[v0] Photo with metadata added:", photoId)
    return photoId
  } catch (error) {
    console.error("[v0] Error adding photo with metadata:", error)
    return null
  }
}

export async function getLocalPhotos() {
  return await getAllPhotos()
}

export async function deletePhoto(photoId: string) {
  await deletePhotoFromDB(photoId)
  console.log("[v0] Photo deleted:", photoId)
}
