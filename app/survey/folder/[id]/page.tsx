"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Home, Folder as FolderIcon, Camera, Download, Eye, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Photo {
  id: string
  url: string
  location: string
  description: string
  timestamp: number
  createdAt: string
}

function FolderDetailPageContent() {
  const router = useRouter()
  const params = useParams()
  const folderId = params.id as string
  
  const [folder, setFolder] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!folderId) return
    loadData()
  }, [folderId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Try local IndexedDB first for offline support
      const { getFolders, getMetadata, getPhoto } = await import("@/lib/indexeddb")
      const localFolders = await getFolders()
      
      // Normalize folderId comparison (string vs possible number/offlineId)
      const localFolder = localFolders.find(f => String(f.id) === String(folderId))
      
      if (localFolder) {
        setFolder({
          id: localFolder.id,
          name: localFolder.name,
          houseName: localFolder.houseName,
          nik: localFolder.nik
        })
        
        // Find photos associated with this folder in local storage
        const allPhotos = await (await import("@/lib/indexeddb")).getAllPhotos()
        const folderPhotos = []
        
        for (const p of allPhotos) {
          const meta = await getMetadata(p.id)
          // Ensure folderId comparison is robust
          if (meta?.folderId && String(meta.folderId) === String(folderId)) {
            folderPhotos.push({
              id: p.id,
              url: URL.createObjectURL(p.blob),
              location: meta.location || "N/A",
              description: meta.description || "",
              timestamp: p.timestamp,
              createdAt: new Date(p.timestamp).toISOString(),
              isOffline: true
            })
          }
        }
        
        if (folderPhotos.length > 0) {
          setPhotos(folderPhotos)
        }
      }

      // Then try to load folder details including photos from server
      const folderRes = await fetch(`/api/folders/${folderId}`)
      if (folderRes.ok) {
        const folderData = await folderRes.json()
        setFolder(prev => ({ ...prev, ...folderData }))
        
        if (folderData.photos) {
          const serverPhotos = folderData.photos.map((p: any) => ({
            id: p.id.toString(),
            url: p.url,
            location: folderData.name || "N/A",
            description: folderData.houseName || "",
            timestamp: new Date(p.createdAt).getTime(),
            createdAt: p.createdAt
          }))
          
          // Merge server photos with local ones, preferring server if synced
          setPhotos(prev => {
            const merged = [...prev]
            serverPhotos.forEach((sp: any) => {
              const index = merged.findIndex(mp => String(mp.id) === String(sp.id) || String(mp.id) === String(sp.offlineId))
              if (index >= 0) {
                merged[index] = sp
              } else {
                merged.push(sp)
              }
            })
            return merged
          })
        }
      }
    } catch (error) {
      console.error("Error loading folder detail:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = (photoUrl: string, photoId: string) => {
    const link = document.createElement("a")
    link.href = photoUrl
    link.download = `photo-${photoId}.jpg`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground font-medium">Memuat data folder...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/survey/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold truncate max-w-[200px]">{folder?.name || "Detail Folder"}</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => {
            if (folderId) {
              router.push(`/survey/upload?folderId=${folderId}&action=camera`)
            }
          }} className="gap-2">
            <Camera className="w-4 h-4" />
            AMBIL FOTO
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-black text-blue-700 uppercase">{folder?.name}</CardTitle>
                <CardDescription className="font-medium mt-1">
                  {folder?.houseName && <span className="block">Pemilik: {folder.houseName}</span>}
                  {folder?.nik && <span className="block">NIK: {folder.nik}</span>}
                </CardDescription>
              </div>
              <Badge variant="secondary">{photos.length} Foto</Badge>
            </div>
          </CardHeader>
        </Card>

        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <FolderIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Belum ada foto di folder ini</h3>
            <p className="text-sm text-gray-400 mb-6">Mulai ambil foto untuk mengisi folder ini</p>
            <Button onClick={() => {
              if (folderId) {
                router.push(`/survey/upload?folderId=${folderId}&action=camera`)
              }
            }} className="gap-2">
              <Camera className="w-4 h-4" />
              AMBIL FOTO SEKARANG
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group hover:border-blue-400 transition-all shadow-sm">
                <div className="aspect-square relative bg-gray-100 overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={photo.description} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Foto+Tidak+Ditemukan"
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="rounded-full w-8 h-8" onClick={() => {
                      setSelectedPhoto(photo)
                      setShowPreview(true)
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full w-8 h-8" onClick={() => handleDownload(photo.url, photo.id)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs font-bold truncate mb-1">{photo.location || "Tanpa Lokasi"}</p>
                  <p className="text-[8px] sm:text-[10px] text-muted-foreground line-clamp-1">{photo.description || "-"}</p>
                  <p className="text-[8px] text-muted-foreground mt-2">{new Date(photo.timestamp).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreview && selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="max-w-4xl w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center text-white">
              <h3 className="font-bold">{selectedPhoto.location}</h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.id)} className="gap-2">
                  <Download className="w-4 h-4" />
                  UNDUH
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="text-white hover:bg-white/10">
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="relative aspect-video sm:aspect-[4/3] w-full bg-black rounded-xl overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description} 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-white">
              <p className="text-sm">{selectedPhoto.description || "Tidak ada deskripsi"}</p>
              <p className="text-xs text-white/60 mt-2">{new Date(selectedPhoto.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function FolderDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FolderDetailPageContent />
    </Suspense>
  )
}
