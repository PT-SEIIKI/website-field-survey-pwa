"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Home, Image as ImageIcon, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnlineStatus } from "@/hooks/use-online-status"

export default function HouseDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <HouseDetailContent />
    </Suspense>
  )
}

function HouseDetailContent() {
  const params = useParams()
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [house, setHouse] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchHouseDetails()
    }
  }, [params.id])

  const fetchHouseDetails = async () => {
    try {
      // Fetch house info
      const houseRes = await fetch(`/api/houses/${params.id}`)
      if (houseRes.ok) {
        const currentHouse = await houseRes.json()
        setHouse(currentHouse)
      }

      // Fetch photos for this house
      const photosRes = await fetch(`/api/photos/list?houseId=${params.id}`)
      if (photosRes.ok) {
        const data = await photosRes.json()
        console.log("[HouseDetail] Photos data:", data)
        // Extract photos from metadata if present, otherwise use the list
        const processedPhotos = (data.photos || []).map((p: any) => {
          let url = p.url;
          if (!url || url.includes('undefined')) {
            if (p.photoData) {
              url = p.photoData;
            } else if (p.fileName) {
              url = `/uploads/${p.fileName}`;
            } else if (p.filename) {
              url = `/uploads/${p.filename}`;
            } else if (p.photoId) {
              url = `/uploads/${p.photoId}.jpg`;
            } else if (p.id) {
              url = `/uploads/${p.id}.jpg`;
            }
          }
          return { ...p, url };
        })
        setPhotos(processedPhotos)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>
  if (!house) return <div className="p-8 text-center uppercase font-bold tracking-widest">Rumah tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight uppercase">{house.name}</h1>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide uppercase ${
            isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
          }`}>
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight uppercase">{house.name}</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Detail Rumah & Foto Survey</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <div key={photo.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary/20">
              <img 
                src={photo.url} 
                alt={`Survey ${i}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-xl">
              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Belum ada foto untuk rumah ini</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
