"use client"

import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { Upload, BarChart3, Wifi, WifiOff, Camera, RefreshCw, Folder as FolderIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { FolderManager } from "@/components/folder-manager"
import { getFolders } from "@/lib/indexeddb"

export default function DashboardPage() {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const syncStatus = useSyncStatus()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [folderStats, setFolderStats] = useState({ total: 0, pending: 0 })

  useEffect(() => {
    const loadFolderStats = async () => {
      try {
        const folders = await getFolders()
        setFolderStats({
          total: folders.length,
          pending: folders.filter(f => f.syncStatus === "pending").length
        })
      } catch (err) {
        console.error("Error loading folder stats:", err)
      }
    }
    loadFolderStats()
  }, [])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    
    if (isOnline) {
      fetch("/api/stats")
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.stats)
        })
        .catch(err => console.error("Error fetching stats:", err))
    }
  }, [router, isOnline])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-1.5 sm:py-2 lg:py-4 flex items-center justify-between">
          <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">Dashboard Survei</h1>

          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <div
              className={`flex items-center gap-0.5 sm:gap-1 lg:gap-2 px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 rounded-full ${
                isOnline ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}
            >
              {isOnline ? <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" /> : <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />}
              <span className="text-[10px] sm:text-xs lg:text-sm font-medium hidden xs:inline">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-3 sm:py-4 lg:py-8">
        {/* Welcome Card */}
        <Card className="mb-3 sm:mb-4 lg:mb-8 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 border-0 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 sm:p-4 lg:p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BarChart3 size={60} className="sm:size-100 lg:size-160" />
          </div>
          <CardHeader className="relative z-10 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
            <CardTitle className="text-lg sm:text-xl lg:text-4xl font-black tracking-tight mb-1 sm:mb-2">
              Hello, {user.username}!
            </CardTitle>
            <CardDescription className="text-blue-100/80 text-xs sm:text-sm lg:text-lg font-medium">
              {user.role === "admin" ? "Systems Administrator Portal" : "Field Surveyor Control Center"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-10">
          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-2 sm:pt-3 lg:pt-6 px-2 sm:px-3 lg:px-4">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 mb-1.5 sm:mb-2 lg:mb-4">
                  <Upload size={12} className="sm:size-16 lg:size-24" />
                </div>
                <div className="text-lg sm:text-xl lg:text-4xl font-black text-blue-600 mb-0.5 sm:mb-1">{syncStatus.totalPending}</div>
                <p className="text-[8px] sm:text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Pending Photos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-2 sm:pt-3 lg:pt-6 px-2 sm:px-3 lg:px-4">
              <div className="flex flex-col items-center">
                <div className={`p-1.5 sm:p-2 lg:p-3 rounded-2xl mb-1.5 sm:mb-2 lg:mb-4 ${isOnline ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                  {isOnline ? <Wifi size={12} className="sm:size-16 lg:size-24" /> : <WifiOff size={12} className="sm:size-16 lg:size-24" />}
                </div>
                <div className={`text-sm sm:text-base lg:text-2xl font-black mb-0.5 sm:mb-1 ${isOnline ? "text-green-600" : "text-orange-600"}`}>
                  {isOnline ? "CONNECTED" : "OFFLINE"}
                </div>
                <p className="text-[8px] sm:text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Network State</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-2 sm:pt-3 lg:pt-6 px-2 sm:px-3 lg:px-4">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 lg:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 mb-1.5 sm:mb-2 lg:mb-4">
                  <RefreshCw size={12} className={`sm:size-16 lg:size-24 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                </div>
                <div className="text-sm sm:text-base lg:text-2xl font-black text-indigo-600 mb-0.5 sm:mb-1">
                  {syncStatus.isSyncing ? "SYNCING..." : "STANDBY"}
                </div>
                <p className="text-[8px] sm:text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Sync Engine</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-2 sm:pt-3 lg:pt-6 px-2 sm:px-3 lg:px-4">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 mb-1.5 sm:mb-2 lg:mb-4">
                  <BarChart3 size={12} className="sm:size-16 lg:size-24" />
                </div>
                <div className="text-sm sm:text-base lg:text-2xl font-black text-purple-600 mb-0.5 sm:mb-1">
                  {stats ? stats.totalPhotos : "--"}
                </div>
                <p className="text-[8px] sm:text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Total Sync</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-2 sm:pt-3 lg:pt-6 px-2 sm:px-3 lg:px-4">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 lg:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 mb-1.5 sm:mb-2 lg:mb-4">
                  <FolderIcon size={12} className="sm:size-16 lg:size-24" />
                </div>
                <div className="text-sm sm:text-base lg:text-2xl font-black text-amber-600 mb-0.5 sm:mb-1">
                  {folderStats.total}
                </div>
                <p className="text-[8px] sm:text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Total Folders</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folder Management Section */}
        <div className="mb-4 sm:mb-6 lg:mb-10">
          <FolderManager />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50/50 dark:from-white/5 dark:to-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-2xl">
            <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-blue-700 dark:text-blue-400 text-lg sm:text-xl lg:text-2xl font-black">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                <span>Upload Foto Survei</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Pilih foto dari galeri perangkat Anda untuk diupload ke sistem</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 sm:pb-6 lg:pb-8 px-3 sm:px-4 lg:px-6">
              <Button 
                onClick={() => router.push("/survey/upload")} 
                size="lg"
                className="w-full h-12 sm:h-14 lg:h-16 text-base sm:text-lg lg:text-xl font-black gap-2 sm:gap-3 shadow-xl transform active:scale-95 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                PILIH FILE GALERI
              </Button>
            </CardContent>
          </Card>

          {user.role === "admin" && (
            <Card className="px-3 sm:px-4 lg:px-6">
              <CardHeader className="pt-3 sm:pt-4 lg:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Admin Panel
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Lihat semua data foto yang telah masuk ke sistem</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 sm:pb-4 lg:pb-6">
                <Button onClick={() => router.push("/admin")} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 sm:h-12 text-sm sm:text-base font-bold">
                  Buka Dashboard Admin
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
