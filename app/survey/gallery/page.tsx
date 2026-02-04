"use client"

import { useRouter } from "next/navigation"
import { useLocalPhotos } from "@/hooks/use-local-photos"
import { LogoutButton } from "@/components/logout-button"
import { deletePhoto } from "@/lib/photo-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Trash2, ImageIcon, RefreshCw, Folder as FolderIcon, Filter } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getMetadata } from "@/lib/indexeddb"

export default function GalleryPage() {
  const router = useRouter()
  const { photos, isLoading, refreshPhotos } = useLocalPhotos()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [photoMetadata, setPhotoMetadata] = useState<Record<string, any>>({})

  useEffect(() => {
    const loadFolders = async () => {
      try {
        // Get folders from server instead of IndexedDB to show only active folders
        const response = await fetch('/api/folders')
        if (response.ok) {
          const data = await response.json()
          setFolders(data)
        }
      } catch (err) {
        console.error("Error loading folders:", err)
      }
    }
    loadFolders()
  }, [])

  useEffect(() => {
    const loadMetadata = async () => {
      const metadataMap: Record<string, any> = {}
      for (const photo of photos) {
        try {
          const meta = await getMetadata(photo.id)
          if (meta) metadataMap[photo.id] = meta
        } catch (err) {
          console.error(`Error loading metadata for ${photo.id}:`, err)
        }
      }
      setPhotoMetadata(metadataMap)
    }
    if (photos.length > 0) loadMetadata()
  }, [photos])

  const handleDelete = async (photoId: string) => {
    if (!confirm("Yakin ingin menghapus foto ini?")) return

    setDeleting(photoId)
    try {
      await deletePhoto(photoId)
      await refreshPhotos()
    } finally {
      setDeleting(null)
    }
  }

  const filteredPhotos = selectedFolder === "all" 
    ? photos 
    : photos.filter(p => {
        const meta = photoMetadata[p.id];
        if (selectedFolder === "none") return !meta || !meta.folderId;
        return meta?.folderId === selectedFolder;
      })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/survey/dashboard")} 
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold uppercase tracking-widest">Local Gallery</h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <Card className="w-full md:w-72 border-border bg-card/50">
            <CardHeader className="px-6 py-4 pb-2">
              <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
                <Filter className="w-3 h-3" />
                Folder Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <select 
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all"
              >
                <option value="all">ALL FOLDERS</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>
                ))}
                <option value="none">NO FOLDER</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loading Gallery...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-secondary/10">
            <ImageIcon className="w-12 h-12 text-muted-foreground/20 mb-6" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
              {selectedFolder === "all" 
                ? "Gallery is empty"
                : "No photos in this folder"}
            </p>
            {selectedFolder === "all" && (
              <Button onClick={() => router.push("/survey/upload")} className="rounded-full px-8 h-10 font-bold uppercase tracking-widest text-[11px]">
                <ImageIcon className="w-4 h-4 mr-2" />
                Upload New
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden border-border bg-card/50 hover:border-foreground/20 transition-all group">
                <div className="relative w-full aspect-square bg-secondary/20">
                  <Image
                    src={URL.createObjectURL(photo.blob) || "/placeholder.svg"}
                    alt="Local photo"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 rounded-full border border-destructive/20 shadow-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {photoMetadata[photo.id]?.folderId && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur border border-border text-[9px] py-0 px-2 h-5 font-bold uppercase tracking-tight">
                        <FolderIcon className="w-2.5 h-2.5 mr-1" />
                        {folders.find(f => f.id === photoMetadata[photo.id].folderId)?.name || "Folder"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">{photo.id.substring(0, 12)}...</p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase tracking-widest border-none ${
                          photo.syncStatus === "synced"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : photo.syncStatus === "syncing"
                              ? "bg-amber-500/10 text-amber-600 animate-pulse"
                              : photo.syncStatus === "failed"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {photo.syncStatus === "synced"
                          ? "Synced"
                          : photo.syncStatus === "syncing"
                            ? "Syncing"
                            : photo.syncStatus === "failed"
                              ? "Failed"
                              : "Pending"}
                      </Badge>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase">{new Date(photo.timestamp).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
