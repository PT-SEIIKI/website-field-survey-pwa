"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, MapPin, Trash2, Eye, Download, RefreshCw, Home, BarChart3, Search, X, ChevronRight } from "lucide-react"

interface Photo {
  photoId: string
  dbId?: string
  filename: string
  location: string
  description: string
  timestamp: number
  uploadedAt: string
  size: number
  folderName?: string
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
    const interval = setInterval(() => {
      loadPhotos()
      loadStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const loadPhotos = async () => {
    try {
      const foldersRes = await fetch('/api/folders')
      const foldersData = await foldersRes.json()
      const folderMap = new Map(foldersData.map((f: any) => [f.id, f.name]))
      const response = await fetch('/api/entries?surveyId=1')
      const data = await response.json()
      if (data.success) {
        const mappedPhotos = data.entries.map((entry: any) => {
          const entryData = JSON.parse(entry.data);
          const photoId = entry.offlineId || entry.id.toString();
          return {
            photoId: photoId,
            dbId: entry.id.toString(),
            filename: `${photoId}.jpg`,
            location: entryData.location || "N/A",
            description: entryData.description || "",
            timestamp: entryData.timestamp || new Date(entry.createdAt).getTime(),
            uploadedAt: entry.createdAt,
            size: 0,
            folderName: entry.folderId ? folderMap.get(entry.folderId) : "Tanpa Folder"
          };
        }).filter((photo: any) => photo.photoId !== "null" && photo.photoId !== "undefined");
        setPhotos(mappedPhotos);
      }
    } catch (error) {
      console.error("Load photos error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()
      if (data.success) setStats(data.stats)
    } catch (error) {
      console.error("Load stats error:", error)
    }
  }

  const handleDelete = async (photoId: string, dbId?: string) => {
    if (!confirm("Yakin ingin menghapus foto ini?")) return
    try {
      const deleteId = dbId || photoId;
      const response = await fetch(`/api/photos/${deleteId}`, { method: "DELETE" })
      if (response.ok) {
        setPhotos(photos.filter((p) => p.photoId !== photoId))
        loadStats()
      }
    } catch (error) {
      console.error("Delete error:", error)
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/survey/dashboard")} className="rounded-full h-9 w-9">
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <h1 className="text-sm font-bold uppercase tracking-widest">Admin Portal</h1>
            </div>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Section */}
        <div className="mb-12 border-b border-border pb-10">
          <div className="flex flex-col gap-2 mb-8">
            <Badge variant="outline" className="w-fit font-mono text-[10px] uppercase px-1.5 py-0 h-4">SYSTEM STATISTICS</Badge>
            <h2 className="text-4xl font-bold tracking-tighter">Data Overview</h2>
          </div>
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdminStatCard label="Total Photos" value={stats.totalPhotos} sub="Uploaded items" />
              <AdminStatCard label="Storage Size" value={`${stats.totalSizeMB} MB`} sub="Total consumption" />
              <AdminStatCard label="Unique Areas" value={stats.locations.length} sub="Surveyed points" />
              <AdminStatCard label="Active Days" value={stats.uniqueDates} sub="Collection period" />
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="mb-10 p-6 border border-border rounded-xl bg-card/50">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Search & Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Location</label>
              <Input
                placeholder="Search location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-10 bg-background/50 border-border focus:ring-1 focus:ring-foreground transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">From Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 bg-background/50 border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">To Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 bg-background/50 border-border" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 h-10 font-bold uppercase tracking-widest text-[11px]">
                Apply
              </Button>
              <Button onClick={handleReset} variant="outline" className="h-10 px-4 border-border">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-background/30">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Survey Entries</h3>
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-4">{photos.length}</Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 border-none hover:bg-secondary/20">
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">ID</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Folder</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Location</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4 hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : photos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">No records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  photos.map((photo) => (
                    <TableRow key={photo.photoId} className="group hover:bg-secondary/30 transition-colors border-border/50">
                      <TableCell className="font-mono text-[9px] text-muted-foreground uppercase">{photo.photoId.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-tight h-5 px-1.5">
                          {photo.folderName || "UNFOLDERED"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium tracking-tight">{photo.location || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(photo.timestamp).toLocaleDateString("id-ID")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => { setSelectedPhoto(photo); setShowPreview(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleDownload(photo.filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(photo.photoId, photo.dbId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowPreview(false)}>
          <div className="max-w-5xl w-full flex flex-col gap-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Badge variant="outline" className="font-mono text-[9px] px-1 h-4 uppercase">{selectedPhoto.photoId}</Badge>
                <h3 className="text-xl font-bold tracking-tight uppercase">{selectedPhoto.location}</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleDownload(selectedPhoto.filename)} className="h-9 px-4 border border-border uppercase text-[10px] font-bold tracking-widest">
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
                src={selectedPhoto.filename.startsWith('http') ? selectedPhoto.filename : `/uploads/${selectedPhoto.filename}`}
                alt={selectedPhoto.description} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('/uploads/linked_uploads/')) {
                    target.src = `/uploads/linked_uploads/${selectedPhoto.filename}`;
                  } else {
                    target.src = "https://placehold.co/800x600?text=Photo+Not+Found"
                  }
                }}
              />
            </div>
            
            <div className="max-w-2xl">
              <p className="text-sm leading-relaxed text-foreground/80">{selectedPhoto.description || "No additional description available."}</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Uploaded: {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Folder: {selectedPhoto.folderName}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminStatCard({ label, value, sub }: { label: string, value: string | number, sub: string }) {
  return (
    <div className="p-6 border border-border rounded-xl bg-card/50 hover:border-foreground/20 transition-all">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{label}</p>
      <div className="text-3xl font-bold tracking-tighter mb-1">{value}</div>
      <p className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground/60">{sub}</p>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  )
}
