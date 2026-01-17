"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, MapPin, Trash2, Eye, Download, RefreshCw, Home, BarChart3, Search } from "lucide-react"

interface Photo {
  photoId: string
  filename: string
  location: string
  description: string
  timestamp: number
  uploadedAt: string
  size: number
}

interface Stats {
  totalPhotos: number
  totalSize: number
  totalSizeMB: number
  locations: string[]
  uniqueDates: number
  oldestPhoto: number | null
  newestPhoto: number | null
}

function AdminPageContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchLocation, setSearchLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()

    if (!currentUser || !isAdmin()) {
      router.push("/login")
      return
    }

    setUser(currentUser)
    loadPhotos()
    loadStats()

    // Reload every 30 seconds
    const interval = setInterval(() => {
      loadPhotos()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/entries?surveyId=1') // Assuming surveyId 1 for now
      const data = await response.json()

      if (data.success) {
        // Map survey entries to the Photo interface used in UI
        const mappedPhotos = data.entries.map((entry: any) => {
          const entryData = JSON.parse(entry.data);
          // Use offlineId for the actual filename on disk
          // Fallback to entry.id (string) only if offlineId is missing
          const photoId = entry.offlineId || entry.id.toString();
          return {
            photoId: photoId,
            dbId: entry.id.toString(),
            filename: `${photoId}.jpg`,
            location: entryData.location || "N/A",
            description: entryData.description || "",
            timestamp: entryData.timestamp || new Date(entry.createdAt).getTime(),
            uploadedAt: entry.createdAt,
            size: 0
          };
        }).filter((photo: any) => photo.photoId !== "null" && photo.photoId !== "undefined");
        setPhotos(mappedPhotos);
      }
    } catch (error) {
      console.error("[v0] Load photos error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("[v0] Load stats error:", error)
    }
  }

  const handleDelete = async (photoId: string, dbId?: string) => {
    if (!confirm("Yakin ingin menghapus foto ini?")) {
      return
    }

    try {
      // Use dbId for database deletion if available, fallback to photoId
      const deleteId = dbId || photoId;
      const response = await fetch(`/api/photos/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPhotos(photos.filter((p) => p.photoId !== photoId))
        loadStats()
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    }
  }

  const handleDownload = (filename: string) => {
    const link = document.createElement("a")
    link.href = `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/${filename}`
    link.download = filename
    link.click()
  }

  const handleSearch = () => {
    setIsLoading(true)
    loadPhotos()
  }

  const handleReset = () => {
    setSearchLocation("")
    setStartDate("")
    setEndDate("")
    setIsLoading(true)
    loadPhotos()
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-primary/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => router.push("/survey/dashboard")} 
              className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-primary"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-base sm:text-lg lg:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-400 dark:to-indigo-300">
                Admin Portal
              </h1>
            </div>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <Card className="px-2 sm:px-3 lg:px-4">
              <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-600 mb-1 sm:mb-2">{stats.totalPhotos}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Foto</p>
                </div>
              </CardContent>
            </Card>

            <Card className="px-2 sm:px-3 lg:px-4">
              <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">{stats.totalSizeMB}MB</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Ukuran</p>
                </div>
              </CardContent>
            </Card>

            <Card className="px-2 sm:px-3 lg:px-4">
              <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2">{stats.locations.length}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Lokasi Unik</p>
                </div>
              </CardContent>
            </Card>

            <Card className="px-2 sm:px-3 lg:px-4">
              <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">{stats.uniqueDates}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Hari Survei</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Section */}
        <Card className="mb-3 sm:mb-4 lg:mb-6">
          <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <div>
                <label className="text-sm font-medium mb-1 sm:mb-2 block">Lokasi</label>
                <Input
                  type="text"
                  placeholder="Cari lokasi..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 sm:mb-2 block">Dari Tanggal</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 sm:mb-2 block">Sampai Tanggal</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 sm:h-10 lg:h-11 text-xs sm:text-sm" />
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-end gap-2 sm:gap-3">
                <Button onClick={handleSearch} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cari</span>
                  <span className="sm:hidden">🔍</span>
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent h-9 sm:h-10 lg:h-11 text-xs sm:text-sm">
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Reset</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Table */}
        <Card className="overflow-hidden">
          <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <span className="text-sm sm:text-base">Daftar Foto Survei</span>
              <Badge variant="secondary" className="w-fit text-xs sm:text-sm">{photos.length} foto</Badge>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Kelola foto yang telah diupload oleh tim survei</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 lg:p-6">
            {isLoading ? (
              <div className="text-center py-6 sm:py-8 lg:py-12 px-3 sm:px-4">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mx-auto text-primary/40 animate-spin mb-2 sm:mb-3 lg:mb-4" />
                <p className="text-muted-foreground font-medium text-xs sm:text-sm lg:text-base">Memuat data survei...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-8 sm:py-12 lg:py-16 px-3 sm:px-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1">Tidak ada foto ditemukan</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-[200px] sm:max-w-[250px] lg:max-w-none mx-auto">Coba sesuaikan filter pencarian untuk melihat data lain</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">ID</TableHead>
                        <TableHead className="text-xs sm:text-sm">Lokasi</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Tanggal</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Deskripsi</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Ukuran</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {photos.map((photo) => (
                        <TableRow key={photo.photoId} className="group hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-[8px] sm:text-[10px] text-muted-foreground">
                            {photo.photoId.substring(0, 6)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 font-semibold text-xs sm:text-sm">
                                <MapPin className="w-3.5 h-3.5 text-primary/60" />
                                <span className="truncate max-w-[100px] sm:max-w-[150px] lg:max-w-[200px]">{photo.location || "N/A"}</span>
                              </div>
                              <div className="sm:hidden text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(photo.timestamp).toLocaleDateString("id-ID")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              {new Date(photo.timestamp).toLocaleDateString("id-ID")}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs truncate text-xs sm:text-sm text-muted-foreground">
                            {photo.description || "-"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm font-medium">
                            {photo.size > 0 ? `${Math.round(photo.size / 1024)} KB` : "-"}
                          </TableCell>
                          <TableCell className="text-right p-1 sm:p-2 lg:p-4">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedPhoto(photo)
                                  setShowPreview(true)
                                }}
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-lg h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDownload(photo.filename)}
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-lg h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9"
                              >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(photo.photoId, photo.dbId)}
                                size="icon-sm"
                                variant="ghost"
                                className="rounded-lg h-6 w-6 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Photo Preview Modal */}
      {showPreview && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 lg:p-6"
          onClick={() => setShowPreview(false)}
        >
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <CardHeader className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-xs sm:text-sm lg:text-base">Preview Foto</CardTitle>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 text-xl font-bold"
                >
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative bg-gray-100 flex items-center justify-center p-2 sm:p-4 h-[300px] sm:h-[400px] lg:h-[500px]">
              <div className="relative w-full h-full">
                <img
                  src={`/uploads/${selectedPhoto.filename}`}
                  alt={selectedPhoto.description || `Photo ${selectedPhoto.photoId}`}
                  className="w-full h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    console.log('Image path:', `/uploads/${selectedPhoto.filename}`);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', `/uploads/${selectedPhoto.filename}`);
                  }}
                />
              </div>
            </CardContent>
            {selectedPhoto.location && (
              <CardContent className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-t">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Lokasi:</span>
                    <span className="text-muted-foreground">{selectedPhoto.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Ukuran:</span>
                    <span className="text-muted-foreground">{selectedPhoto.size > 0 ? `${Math.round(selectedPhoto.size / 1024)} KB` : "-"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Tanggal:</span>
                    <span className="text-muted-foreground">{new Date(selectedPhoto.timestamp).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageContent />
    </Suspense>
  )
}
