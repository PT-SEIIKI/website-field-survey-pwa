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
import Image from "next/image"

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
      const params = new URLSearchParams()

      if (searchLocation) {
        params.append("location", searchLocation)
      }

      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString())
      }

      if (endDate) {
        params.append("endDate", new Date(endDate).toISOString())
      }

      const response = await fetch(`/api/photos/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setPhotos(data.photos)
      }
    } catch (error) {
      console.error("[v0] Load photos error:", error)
    } finally {
      setIsLoading(false)
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

  const handleDelete = async (photoId: string) => {
    if (!confirm("Yakin ingin menghapus foto ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
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
    link.href = `/uploads/${filename}`
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/survey/dashboard")} 
              className="p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-primary"
            >
              <Home className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-400 dark:to-indigo-300">
                Admin Portal
              </h1>
            </div>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.totalPhotos}</div>
                  <p className="text-sm text-muted-foreground">Total Foto</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{stats.totalSizeMB}MB</div>
                  <p className="text-sm text-muted-foreground">Total Ukuran</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.locations.length}</div>
                  <p className="text-sm text-muted-foreground">Lokasi Unik</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stats.uniqueDates}</div>
                  <p className="text-sm text-muted-foreground">Hari Survei</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Lokasi</label>
                <Input
                  type="text"
                  placeholder="Cari lokasi..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Search className="w-4 h-4" />
                  Cari
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daftar Foto Survei</span>
              <Badge variant="secondary">{photos.length} foto</Badge>
            </CardTitle>
            <CardDescription>Kelola foto yang telah diupload oleh tim survei</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 mx-auto text-gray-400 animate-spin mb-2" />
                <p className="text-muted-foreground">Memuat foto...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No photos found</div>
                <p className="text-sm text-muted-foreground">Coba sesuaikan filter pencarian Anda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Foto</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Ukuran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {photos.map((photo) => (
                      <TableRow key={photo.photoId} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-xs">{photo.photoId.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {photo.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(photo.timestamp).toLocaleDateString("id-ID")}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{photo.description || "-"}</TableCell>
                        <TableCell className="text-sm">{Math.round(photo.size / 1024)}KB</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => {
                                setSelectedPhoto(photo)
                                setShowPreview(true)
                              }}
                              size="sm"
                              variant="outline"
                              className="bg-transparent gap-1"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDownload(photo.filename)}
                              size="sm"
                              variant="outline"
                              className="bg-transparent gap-1"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(photo.photoId)}
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Photo Preview Modal */}
      {showPreview && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <Card className="max-w-2xl w-full max-h-96 overflow-hidden">
            <CardHeader>
              <CardTitle>Preview Foto</CardTitle>
            </CardHeader>
            <CardContent className="relative bg-gray-100 flex items-center justify-center" style={{ height: "400px" }}>
              <Image
                src={`/uploads/${selectedPhoto.filename}`}
                alt="Preview"
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </CardContent>
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
