"use client"

import { useRouter } from "next/navigation"
import { useLocalPhotos } from "@/hooks/use-local-photos"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { addPhotoWithMetadata } from "@/lib/photo-manager"
import { initConnectivityListener } from "@/lib/connectivity"
import { initSyncManager, startSync } from "@/lib/sync-manager"
import { UploadArea } from "@/components/upload-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Suspense, useEffect, useState } from "react"

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <UploadPageContent />
    </Suspense>
  )
}

function UploadPageContent() {
  const router = useRouter()
  const { photos, isLoading, refreshPhotos } = useLocalPhotos()
  const isOnline = useOnlineStatus()
  const syncStatus = useSyncStatus()

  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  const [villages, setVillages] = useState<any[]>([])
  const [subVillages, setSubVillages] = useState<any[]>([])
  const [houses, setHouses] = useState<any[]>([])
  
  const [selectedVillageId, setSelectedVillageId] = useState<string>("")
  const [selectedSubVillageId, setSelectedSubVillageId] = useState<string>("")
  const [selectedHouseId, setSelectedHouseId] = useState<string>("")

  useEffect(() => {
    const fetchVillages = async () => {
      const res = await fetch("/api/villages")
      if (res.ok) setVillages(await res.json())
    }
    fetchVillages()
  }, [])

  useEffect(() => {
    if (!selectedVillageId) {
      setSubVillages([])
      setSelectedSubVillageId("")
      return
    }
    const fetchSubVillages = async () => {
      const res = await fetch(`/api/sub-villages?villageId=${selectedVillageId}`)
      if (res.ok) setSubVillages(await res.json())
    }
    fetchSubVillages()
  }, [selectedVillageId])

  useEffect(() => {
    if (!selectedSubVillageId) {
      setHouses([])
      setSelectedHouseId("")
      return
    }
    const fetchHouses = async () => {
      const res = await fetch(`/api/houses?subVillageId=${selectedSubVillageId}`)
      if (res.ok) setHouses(await res.json())
    }
    fetchHouses()
  }, [selectedSubVillageId])

  useEffect(() => {
    initConnectivityListener()
    initSyncManager()
    if (isOnline) {
      startSync()
    }
  }, [isOnline])

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true)
    try {
      for (const file of files) {
        await addPhotoWithMetadata(file, {
          location: houses.find(h => h.id === parseInt(selectedHouseId))?.name || undefined,
          villageId: selectedVillageId,
          subVillageId: selectedSubVillageId,
          houseId: selectedHouseId
        })
      }
      setSuccessMessage(`${files.length} foto berhasil ditambahkan`)
      await refreshPhotos()
      setTimeout(() => setSuccessMessage(""), 3000)
      if (isOnline) {
        startSync()
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSync = async () => {
    await startSync()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()} 
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">Upload Foto</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide uppercase ${
              isOnline 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-orange-500/10 text-orange-600 border-orange-500/20"
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            {syncStatus.totalPending > 0 && (
              <div className="bg-secondary border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{syncStatus.totalPending} foto tertunda</p>
                    <p className="text-xs text-muted-foreground">Otomatis sinkron saat online</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSync} 
                  disabled={syncStatus.isSyncing || !isOnline} 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-xs bg-background"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {successMessage}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4 p-6 border border-border rounded-xl bg-card/50">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Desa</label>
                  <select 
                    value={selectedVillageId}
                    onChange={(e) => setSelectedVillageId(e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all"
                  >
                    <option value="">Pilih Desa</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dusun</label>
                  <select 
                    value={selectedSubVillageId}
                    onChange={(e) => setSelectedSubVillageId(e.target.value)}
                    disabled={!selectedVillageId}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all disabled:opacity-50"
                  >
                    <option value="">Pilih Dusun</option>
                    {subVillages.map(sv => (
                      <option key={sv.id} value={sv.id}>{sv.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rumah</label>
                  <select 
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                    disabled={!selectedSubVillageId}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all disabled:opacity-50"
                  >
                    <option value="">Pilih Rumah</option>
                    {houses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <UploadArea onFilesSelected={handleFilesSelected} isLoading={isUploading} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 border border-border rounded-lg overflow-hidden bg-background">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Status Sinkronisasi</h3>
                <Badge variant="outline" className="font-mono text-[10px]">{photos.length}</Badge>
              </div>
              <div className="p-4">
                <Tabs defaultValue="pending">
                  <TabsList className="grid grid-cols-4 w-full h-8 p-0 bg-secondary rounded-md overflow-hidden mb-4">
                    <TabsTrigger value="pending" className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background">Tertunda</TabsTrigger>
                    <TabsTrigger value="syncing" className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background">Proses</TabsTrigger>
                    <TabsTrigger value="synced" className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background">Selesai</TabsTrigger>
                    <TabsTrigger value="failed" className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background">Gagal</TabsTrigger>
                  </TabsList>

                  <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    <TabsContent value="pending" className="m-0 space-y-1">
                      <PhotoList status="pending" photos={photos} />
                    </TabsContent>
                    <TabsContent value="syncing" className="m-0 space-y-1">
                      <PhotoList status="syncing" photos={photos} />
                    </TabsContent>
                    <TabsContent value="synced" className="m-0 space-y-1">
                      <PhotoList status="synced" photos={photos} />
                    </TabsContent>
                    <TabsContent value="failed" className="m-0 space-y-1">
                      <PhotoList status="failed" photos={photos} />
                    </TabsContent>
                  </div>
                </Tabs>

                <Button
                  onClick={refreshPhotos}
                  variant="ghost"
                  className="w-full mt-4 h-9 text-xs text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Segarkan List
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function PhotoList({ status, photos }: { status: string, photos: any[] }) {
  const filtered = photos.filter(p => {
    if (status === "pending") return !p.syncStatus || p.syncStatus === "pending"
    return p.syncStatus === status
  })

  if (filtered.length === 0) {
    return <p className="text-center py-10 text-[10px] text-muted-foreground italic uppercase tracking-widest">Kosong</p>
  }

  return (
    <div className="space-y-1.5">
      {filtered.map((photo) => (
        <div key={photo.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/30">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground truncate">{photo.id.substring(0, 8)}</span>
            <span className="text-[11px] font-medium truncate">{photo.location || "Tanpa Lokasi"}</span>
          </div>
          <div className={`h-1.5 w-1.5 rounded-full ${
            photo.syncStatus === 'synced' ? 'bg-emerald-500' :
            photo.syncStatus === 'failed' ? 'bg-rose-500' :
            photo.syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
            'bg-muted-foreground/30'
          }`} />
        </div>
      ))}
    </div>
  )
}
