"use client"

import { useRouter } from "next/navigation"
import { useLocalPhotos } from "@/hooks/use-local-photos"
import { LogoutButton } from "@/components/logout-button"
import { deletePhoto } from "@/lib/photo-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Trash2, ImageIcon, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export default function GalleryPage() {
  const router = useRouter()
  const { photos, isLoading, refreshPhotos } = useLocalPhotos()
  const [deleting, setDeleting] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/survey/dashboard")} className="p-2 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Galeri Foto Lokal</h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Foto yang Tersimpan Lokal</span>
              <Badge variant="secondary">{photos.length}</Badge>
            </CardTitle>
            <CardDescription>Foto yang belum tersinkronisasi atau gagal sinkronisasi</CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-2" />
            <p className="text-muted-foreground">Memuat foto...</p>
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">Belum ada foto</p>
              <p className="text-sm text-muted-foreground mb-4">
                Mulai dengan upload atau ambil foto menggunakan kamera
              </p>
              <Button onClick={() => router.push("/survey/upload")} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <ImageIcon className="w-4 h-4" />
                Upload Foto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative w-full aspect-square bg-gray-100 group">
                  <Image
                    src={URL.createObjectURL(photo.blob) || "/placeholder.svg"}
                    alt="Local photo"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </Button>
                  </div>
                </div>

                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-gray-600">{photo.id.substring(0, 12)}...</p>
                    <Badge
                      variant="outline"
                      className={`${
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
                    <p className="text-xs text-muted-foreground">{new Date(photo.timestamp).toLocaleString("id-ID")}</p>
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
