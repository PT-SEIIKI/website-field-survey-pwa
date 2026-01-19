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
import { getFolders, getMetadata } from "@/lib/indexeddb"

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
        const data = await getFolders()
        setFolders(data)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-primary/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => router.push("/survey/dashboard")} 
              className="p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-primary"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-400 dark:to-indigo-300">
              Local Gallery
            </h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Card className="flex-1">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base lg:text-lg">
                <span>Foto yang Tersimpan Lokal</span>
                <Badge variant="secondary" className="text-xs sm:text-sm">{filteredPhotos.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Foto yang belum tersinkronisasi atau gagal sinkronisasi</CardDescription>
            </CardHeader>
          </Card>

          <Card className="w-full md:w-72">
            <CardHeader className="px-4 py-3 pb-2">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Filter className="w-3 h-3" />
                Filter Folder
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <select 
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full h-10 rounded-xl border-2 border-primary/10 bg-background px-3 py-1 text-sm font-semibold shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">📁 Semua Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
                <option value="none">⚪ Tanpa Folder</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 animate-spin mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Memuat foto...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 sm:py-12 px-4">
              <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">Belum ada foto</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {selectedFolder === "all" 
                  ? "Mulai dengan upload atau ambil foto menggunakan kamera"
                  : "Tidak ada foto dalam folder ini"}
              </p>
              {selectedFolder === "all" && (
                <Button onClick={() => router.push("/survey/upload")} className="gap-2 bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm">
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  Upload Foto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative w-full aspect-square bg-gray-100 group">
                  <Image
                    src={URL.createObjectURL(photo.blob) || "/placeholder.svg"}
                    alt="Local photo"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      variant="destructive"
                      size="sm"
                      className="gap-1 sm:gap-2 h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Hapus</span>
                    </Button>
                  </div>

                  {photoMetadata[photo.id]?.folderId && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 backdrop-blur text-blue-700 hover:bg-white flex items-center gap-1 border-none shadow-sm text-[9px] py-0 px-1.5 h-5 font-bold">
                        <FolderIcon className="w-2.5 h-2.5" />
                        {folders.find(f => f.id === photoMetadata[photo.id].folderId)?.name || "Folder"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs font-mono text-gray-600">{photo.id.substring(0, 12)}...</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs ${
                        photo.syncStatus === "synced"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : photo.syncStatus === "syncing"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : photo.syncStatus === "failed"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {photo.syncStatus === "synced"
                        ? "✓ Tersinkronisasi"
                        : photo.syncStatus === "syncing"
                          ? "⟳ Sedang Sinkronisasi"
                          : photo.syncStatus === "failed"
                            ? "✗ Gagal"
                            : "⧖ Pending"}
                    </Badge>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{new Date(photo.timestamp).toLocaleString("id-ID")}</p>
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

        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 animate-spin mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Memuat foto...</p>
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 sm:py-12 px-4">
              <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">Belum ada foto</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Mulai dengan upload atau ambil foto menggunakan kamera
              </p>
              <Button onClick={() => router.push("/survey/upload")} className="gap-2 bg-blue-600 hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm">
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                Upload Foto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative w-full aspect-square bg-gray-100 group">
                  <Image
                    src={URL.createObjectURL(photo.blob) || "/placeholder.svg"}
                    alt="Local photo"
                    fill
                    className="object-contain group-hover:scale-105 transition-transform"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      variant="destructive"
                      size="sm"
                      className="gap-1 sm:gap-2 h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Hapus</span>
                    </Button>
                  </div>

                  {photoMetadata[photo.id]?.folderId && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 backdrop-blur text-blue-700 hover:bg-white flex items-center gap-1 border-none shadow-sm text-[9px] py-0 px-1.5 h-5 font-bold">
                        <FolderIcon className="w-2.5 h-2.5" />
                        {folders.find(f => f.id === photoMetadata[photo.id].folderId)?.name || "Folder"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs font-mono text-gray-600">{photo.id.substring(0, 12)}...</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs ${
                        photo.syncStatus === "synced"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : photo.syncStatus === "syncing"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : photo.syncStatus === "failed"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {photo.syncStatus === "synced"
                        ? "✓ Tersinkronisasi"
                        : photo.syncStatus === "syncing"
                          ? "⟳ Sedang Sinkronisasi"
                          : photo.syncStatus === "failed"
                            ? "✗ Gagal"
                            : "⧖ Pending"}
                    </Badge>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{new Date(photo.timestamp).toLocaleString("id-ID")}</p>
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
