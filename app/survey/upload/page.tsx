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
import { useSearchParams } from "next/navigation"

export default function UploadPage() {
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/survey/dashboard")} 
              className="p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-primary"
            >
              <Home className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-400 dark:to-indigo-300">
              Upload Survey
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                isOnline ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {syncStatus.totalPending > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{syncStatus.totalPending} foto menunggu sinkronisasi</p>
                    <p className="text-sm text-blue-700">Foto akan dikirim otomatis saat koneksi tersedia</p>
                  </div>
                </div>
                <Button onClick={handleSync} disabled={syncStatus.isSyncing || !isOnline} size="sm" className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                  {syncStatus.isSyncing ? "Sinkronisasi..." : "Sinkronisasi Sekarang"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Foto Survei</CardTitle>
                <CardDescription>
                  {isOnline
                    ? "Foto akan diupload secara langsung ke server"
                    : "Foto akan disimpan lokal dan dikirim saat online"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UploadArea onFilesSelected={handleFilesSelected} isLoading={isUploading} />
              </CardContent>
            </Card>

            {/* Camera Capture Section */}
            <Card id="camera-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Camera className="w-6 h-6" />
                  Ambil Foto Langsung
                </CardTitle>
                <CardDescription>Gunakan kamera HP Anda untuk mengambil foto bukti lapangan</CardDescription>
              </CardHeader>
              <CardContent>
                {showCamera ? (
                  <>
                    {/* Metadata Form */}
                    <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Lokasi Survei</label>
                        <Input
                          type="text"
                          placeholder="Masukkan lokasi (misal: Lantai 2, Area Parkir)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={isUploading}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700">Keterangan Foto</label>
                        <Textarea
                          placeholder="Tambahkan catatan penting tentang foto ini..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={isUploading}
                          className="resize-none mt-1"
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
                    className="w-full py-8 text-lg font-bold gap-3 bg-blue-600 hover:bg-blue-700 shadow-lg animate-pulse hover:animate-none"
                  >
                    <Camera className="w-8 h-8" />
                    BUKA KAMERA SEKARANG
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Local Gallery */}
          <Card className="sticky top-24 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Galeri Lokal</span>
                <Badge variant="secondary">{photos.length}</Badge>
              </CardTitle>
              <CardDescription>Foto yang belum tersinkronisasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin mb-2">
                    <Upload className="w-6 h-6 mx-auto text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Memuat foto...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Belum ada foto</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`p-2 rounded border text-xs ${
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
                      <Badge variant="outline" className="mt-1">
                        {photo.syncStatus === "synced"
                          ? "✓ Tersinkronisasi"
                          : photo.syncStatus === "syncing"
                            ? "⟳ Sedang sinkronisasi"
                            : photo.syncStatus === "failed"
                              ? "✗ Gagal"
                              : "⧖ Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={refreshPhotos}
                variant="outline"
                className="w-full mt-4 bg-transparent"
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
