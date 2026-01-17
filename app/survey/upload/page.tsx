"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocalPhotos } from "@/hooks/use-local-photos"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { addPhotos, addPhotoWithMetadata } from "@/lib/photo-manager"
import { initConnectivityListener } from "@/lib/connectivity"
import { initSyncManager, startSync } from "@/lib/sync-manager"
import { CameraCapture } from "@/components/camera-capture"
import { UploadArea } from "@/components/upload-area"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Camera, Home, RefreshCw, Upload, Wifi, WifiOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPageContent />
    </Suspense>
  )
}

function UploadPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { photos, isLoading, refreshPhotos } = useLocalPhotos()
  const isOnline = useOnlineStatus()
  const syncStatus = useSyncStatus()

  const [showCamera, setShowCamera] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    // Initialize offline & sync features
    initConnectivityListener()
    initSyncManager()

    // Auto-sync when online
    if (isOnline) {
      startSync()
    }
  }, [isOnline])

  useEffect(() => {
    // Check if camera should be opened immediately
    if (searchParams.get("action") === "camera") {
      setShowCamera(true)
      // Scroll to camera section
      setTimeout(() => {
        document.getElementById("camera-section")?.scrollIntoView({ behavior: "smooth" })
      }, 500)
    }
  }, [searchParams])

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true)
    try {
      const photoIds = await addPhotos(Array.from(files))
      setSuccessMessage(`${photoIds.length} foto berhasil ditambahkan`)
      await refreshPhotos()

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000)

      // Auto-sync if online
      if (isOnline) {
        startSync()
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCapturePhoto = async (blob: Blob) => {
    setIsUploading(true)
    try {
      await addPhotoWithMetadata(blob, {
        location: location || undefined,
        description: description || undefined,
      })

      setSuccessMessage("Foto berhasil ditambahkan")
      await refreshPhotos()
      setShowCamera(false)
      setLocation("")
      setDescription("")

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000)

      // Auto-sync if online
      if (isOnline) {
        startSync()
      }
    } catch (error) {
      console.error("[v0] Capture error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSync = async () => {
    await startSync()
  }

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
              Upload Survey
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full ${
                isOnline ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="text-xs sm:text-sm font-medium">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Status Banner */}
        {syncStatus.totalPending > 0 && (
          <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm sm:text-base">{syncStatus.totalPending} foto menunggu sinkronisasi</p>
                    <p className="text-xs sm:text-sm text-blue-700">Foto akan dikirim otomatis saat koneksi tersedia</p>
                  </div>
                </div>
                <Button onClick={handleSync} disabled={syncStatus.isSyncing || !isOnline} size="sm" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm">
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                  <span className="hidden xs:inline">{syncStatus.isSyncing ? "Sinkronisasi..." : "Sinkronisasi Sekarang"}</span>
                  <span className="xs:hidden">{syncStatus.isSyncing ? "..." : "Sync"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <p className="text-green-700 font-medium text-sm sm:text-base">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Upload Section */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="px-4 sm:px-6">
              <CardHeader className="pb-4 sm:pb-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Upload Foto Survei</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {isOnline
                    ? "Foto akan diupload secara langsung ke server"
                    : "Foto akan disimpan lokal dan dikirim saat online"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-4 sm:pb-6">
                <UploadArea onFilesSelected={handleFilesSelected} isLoading={isUploading} />
              </CardContent>
            </Card>

            {/* Camera Capture Section */}
            <Card id="camera-section" className="px-4 sm:px-6">
              <CardHeader className="pb-4 sm:pb-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-sm sm:text-base lg:text-lg">
                  <Camera className="w-4 h-4 sm:w-6 sm:h-6" />
                  Ambil Foto Langsung
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gunakan kamera HP Anda untuk mengambil foto bukti lapangan</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 sm:pb-6">
                {showCamera ? (
                  <>
                    {/* Metadata Form */}
                    <div className="space-y-3 sm:space-y-4 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Lokasi Survei</label>
                        <Input
                          type="text"
                          placeholder="Masukkan lokasi (misal: Lantai 2, Area Parkir)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={isUploading}
                          className="mt-1 h-10 sm:h-11"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700">Keterangan Foto</label>
                        <Textarea
                          placeholder="Tambahkan catatan penting tentang foto ini..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={isUploading}
                          className="resize-none mt-1 h-20 sm:h-24"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Camera */}
                    <CameraCapture
                      onCapture={handleCapturePhoto}
                      onCancel={() => {
                        setShowCamera(false)
                        setLocation("")
                        setDescription("")
                      }}
                    />
                  </>
                ) : (
                  <Button 
                    onClick={() => setShowCamera(true)} 
                    className="w-full py-6 sm:py-8 text-base sm:text-lg font-bold gap-2 sm:gap-3 bg-blue-600 hover:bg-blue-700 shadow-lg animate-pulse hover:animate-none h-12 sm:h-14"
                  >
                    <Camera className="w-5 h-5 sm:w-8 sm:h-8" />
                    <span className="text-sm sm:text-base">BUKA KAMERA SEKARANG</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Local Gallery */}
          <Card className="sticky top-20 sm:top-24 h-fit">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Galeri Lokal</span>
                <Badge variant="secondary" className="text-xs sm:text-sm">{photos.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Status sinkronisasi foto di perangkat ini</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {isLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin mb-2">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-400" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Memuat foto...</p>
                </div>
              ) : (
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full h-9 mb-4">
                    <TabsTrigger value="failed" className="text-[10px] px-0">Gagal</TabsTrigger>
                    <TabsTrigger value="pending" className="text-[10px] px-0">Pending</TabsTrigger>
                    <TabsTrigger value="syncing" className="text-[10px] px-0">Sync</TabsTrigger>
                    <TabsTrigger value="synced" className="text-[10px] px-0">Berhasil</TabsTrigger>
                  </TabsList>

                  <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2">
                    <TabsContent value="failed" className="mt-0 space-y-2">
                      {photos.filter(p => p.syncStatus === "failed").length === 0 ? (
                        <p className="text-center py-4 text-[10px] text-muted-foreground">Tidak ada</p>
                      ) : (
                        photos.filter(p => p.syncStatus === "failed").map((photo) => (
                          <PhotoItem key={photo.id} photo={photo} />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0 space-y-2">
                      {photos.filter(p => !p.syncStatus || p.syncStatus === "pending").length === 0 ? (
                        <p className="text-center py-4 text-[10px] text-muted-foreground">Tidak ada</p>
                      ) : (
                        photos.filter(p => !p.syncStatus || p.syncStatus === "pending").map((photo) => (
                          <PhotoItem key={photo.id} photo={photo} />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="syncing" className="mt-0 space-y-2">
                      {photos.filter(p => p.syncStatus === "syncing").length === 0 ? (
                        <p className="text-center py-4 text-[10px] text-muted-foreground">Tidak ada</p>
                      ) : (
                        photos.filter(p => p.syncStatus === "syncing").map((photo) => (
                          <PhotoItem key={photo.id} photo={photo} />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="synced" className="mt-0 space-y-2">
                      {photos.filter(p => p.syncStatus === "synced").length === 0 ? (
                        <p className="text-center py-4 text-[10px] text-muted-foreground">Tidak ada</p>
                      ) : (
                        photos.filter(p => p.syncStatus === "synced").map((photo) => (
                          <PhotoItem key={photo.id} photo={photo} />
                        ))
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              )}

              <Button
                onClick={refreshPhotos}
                variant="outline"
                className="w-full mt-4 bg-transparent h-9 sm:h-10 text-xs sm:text-sm"
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function PhotoItem({ photo }: { photo: any }) {
  return (
    <div
      className={`p-2 rounded border text-[10px] ${
        photo.syncStatus === "synced"
          ? "bg-green-50 border-green-200"
          : photo.syncStatus === "failed"
            ? "bg-red-50 border-red-200"
            : photo.syncStatus === "syncing"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-gray-50 border-gray-200"
      }`}
    >
      <p className="font-medium truncate">{photo.id.substring(0, 8)}...</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">
          {photo.syncStatus === "synced"
            ? "Berhasil"
            : photo.syncStatus === "syncing"
              ? "Sinkronisasi..."
              : photo.syncStatus === "failed"
                ? "Gagal"
                : "Menunggu"}
        </span>
      </div>
    </div>
  )
}
