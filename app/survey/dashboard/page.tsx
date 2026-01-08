"use client"

import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { Upload, BarChart3, Wifi, WifiOff, Camera, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const syncStatus = useSyncStatus()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Survei</h1>

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
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 border-0 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BarChart3 size={160} />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-4xl font-black tracking-tight mb-2">
              Hello, {user.username}!
            </CardTitle>
            <CardDescription className="text-blue-100/80 text-lg font-medium">
              {user.role === "admin" ? "Systems Administrator Portal" : "Field Surveyor Control Center"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 mb-4">
                  <Upload size={24} />
                </div>
                <div className="text-4xl font-black text-blue-600 mb-1">{syncStatus.totalPending}</div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Photos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center">
                <div className={`p-3 rounded-2xl mb-4 ${isOnline ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                  {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
                </div>
                <div className={`text-2xl font-black mb-1 ${isOnline ? "text-green-600" : "text-orange-600"}`}>
                  {isOnline ? "CONNECTED" : "OFFLINE"}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Network State</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 mb-4">
                  <RefreshCw size={24} className={syncStatus.isSyncing ? "animate-spin" : ""} />
                </div>
                <div className="text-2xl font-black text-indigo-600 mb-1">
                  {syncStatus.isSyncing ? "SYNCING..." : "STANDBY"}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sync Engine</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm hover:-translate-y-1 transition-all">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 mb-4">
                  <BarChart3 size={24} />
                </div>
                <div className="text-xl font-mono font-bold text-purple-600 mb-1">
                  {syncStatus.lastSyncTime
                    ? new Date(syncStatus.lastSyncTime).toLocaleTimeString("id-ID", { hour12: false })
                    : "--:--"}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Sync</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-gradient-to-br from-white to-blue-50/50 dark:from-white/5 dark:to-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700 dark:text-blue-400 text-2xl font-black">
                <Camera className="w-7 h-7" />
                Capture Evidence
              </CardTitle>
              <CardDescription className="text-base">Mulai dokumentasi lapangan baru dengan kamera perangkat</CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button 
                onClick={() => router.push("/survey/upload?action=camera")} 
                size="lg"
                className="w-full h-16 text-xl font-black gap-3 shadow-xl transform active:scale-95"
              >
                <Camera className="w-7 h-7" />
                OPEN CAMERA PORTAL
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload File
              </CardTitle>
              <CardDescription>Upload foto dari galeri HP</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/survey/upload")} variant="outline" className="w-full py-6">
                Pilih File
              </Button>
            </CardContent>
          </Card>

          {user.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Admin Panel
                </CardTitle>
                <CardDescription>Lihat semua foto yang telah diupload</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/admin")} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Buka Admin
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
