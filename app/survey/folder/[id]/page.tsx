"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Folder as FolderIcon, Download, Eye, RefreshCw, ArrowLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Photo {
  id: string
  url: string
  location: string
  description: string
  timestamp: number
  createdAt: string
  isOffline?: boolean
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
      const { getFolders, getMetadata, getAllPhotos } = await import("@/lib/indexeddb")
      const localFolders = await getFolders()
      const localFolder = localFolders.find(f => String(f.id) === String(folderId))
      
      if (localFolder) {
        setFolder({
          id: localFolder.id,
          name: localFolder.name,
          houseName: localFolder.houseName,
          nik: localFolder.nik
        })
        
        const allPhotos = await getAllPhotos()
        const folderPhotos = []
        
        for (const p of allPhotos) {
          const meta = await getMetadata(p.id)
          if (meta?.folderId && String(meta.folderId) === String(folderId)) {
            folderPhotos.push({
              id: p.id,
              url: URL.createObjectURL(p.blob),
              location: meta.location || "Tanpa Lokasi",
              description: meta.description || "",
              timestamp: p.timestamp,
              createdAt: new Date(p.timestamp).toISOString(),
              isOffline: true
            })
          }
        }
        setPhotos(folderPhotos)
      }

      const folderRes = await fetch(`/api/folders/${folderId}`)
      if (folderRes.ok) {
        const folderData = await folderRes.json()
        setFolder(prev => ({ ...prev, ...folderData }))
        
        if (folderData.photos) {
          const serverPhotos = folderData.photos.map((p: any) => ({
            id: p.id.toString(),
            url: p.url,
            location: folderData.name || "Tanpa Lokasi",
            description: folderData.houseName || "",
            timestamp: new Date(p.createdAt).getTime(),
            createdAt: p.createdAt
          }))
          
          setPhotos(prev => {
            const merged = [...prev]
            serverPhotos.forEach((sp: any) => {
              const index = merged.findIndex(mp => String(mp.id) === String(sp.id) || (mp.isOffline && String(mp.id) === String(sp.offlineId)))
              if (index >= 0) {
                merged[index] = sp
              } else {
                merged.push(sp)
              }
            })
            return merged.sort((a, b) => b.timestamp - a.timestamp)
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Loading Folder</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/survey/dashboard")} className="rounded-full h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold tracking-tight uppercase">{folder?.name || "Folder"}</h1>
              <p className="text-[10px] text-muted-foreground font-mono">{folderId}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => router.push("/survey/upload?folderId=" + folderId)} 
            className="rounded-full px-4 h-9 font-medium"
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            Upload
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div className="space-y-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 mb-2">FOLDER DETAIL</Badge>
              <h2 className="text-4xl font-bold tracking-tighter">{folder?.name}</h2>
              <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                {folder?.houseName && <span className="flex items-center gap-1.5">• {folder.houseName}</span>}
                {folder?.nik && <span className="flex items-center gap-1.5">• NIK: {folder.nik}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Photos</p>
              <p className="text-3xl font-mono leading-none">{photos.length}</p>
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-secondary/20">
            <FolderIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-medium">No photos found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">Start by uploading some photos to this folder.</p>
            <Button onClick={() => router.push("/survey/upload?folderId=" + folderId)} variant="outline" size="sm">
              Upload Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card shadow-sm relative">
                  <img 
                    src={photo.url} 
                    alt={photo.description} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Photo+Not+Found"
                    }}
                  />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="rounded-full w-10 h-10 border border-border shadow-sm" 
                      onClick={() => {
                        setSelectedPhoto(photo)
                        setShowPreview(true)
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="rounded-full w-10 h-10 border border-border shadow-sm" 
                      onClick={() => handleDownload(photo.url, photo.id)}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                  {photo.isOffline && (
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-none text-[8px] h-4 px-1">OFFLINE</Badge>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className="text-xs font-bold tracking-tight uppercase truncate">{photo.location}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{photo.description || "No description"}</p>
                  <p className="text-[9px] font-mono text-muted-foreground pt-1">{new Date(photo.timestamp).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modern Preview Overlay */}
      {showPreview && selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowPreview(false)}>
          <div className="max-w-5xl w-full flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Badge variant="outline" className="font-mono text-[9px] px-1 h-4">{selectedPhoto.id}</Badge>
                <h3 className="text-xl font-bold tracking-tight uppercase">{selectedPhoto.location}</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.id)} className="h-9 px-4 border border-border">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="rounded-full h-9 w-9">
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>
            
            <div className="relative aspect-video sm:aspect-[16/10] w-full bg-secondary/20 rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description} 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="max-w-2xl">
              <p className="text-sm leading-relaxed text-foreground/80">{selectedPhoto.description || "No description available for this survey photo."}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-4 uppercase tracking-widest">{new Date(selectedPhoto.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FolderDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <FolderDetailPageContent />
    </Suspense>
  )
}
