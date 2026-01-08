"use client"

import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { Upload, BarChart3, Wifi, WifiOff, Camera } from "lucide-react"
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
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
          <CardHeader>
            <CardTitle className="text-3xl">Selamat Datang, {user.username}!</CardTitle>
            <CardDescription className="text-blue-100">
              {user.role === "admin" ? "Panel Admin Survei" : "Aplikasi Survei Lapangan"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{syncStatus.totalPending}</div>
                <p className="text-sm text-muted-foreground">Foto Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${isOnline ? "text-green-600" : "text-orange-600"}`}>
                  {isOnline ? "Online" : "Offline"}
                </div>
                <p className="text-sm text-muted-foreground">Status Koneksi</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold mb-2 ${syncStatus.isSyncing ? "text-yellow-600 animate-pulse" : "text-gray-600"}`}
                >
                  {syncStatus.isSyncing ? "Sinkronisasi..." : "Siap"}
                </div>
                <p className="text-sm text-muted-foreground">Status Sync</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-lg font-mono text-gray-600 mb-2">
                  {syncStatus.lastSyncTime
                    ? new Date(syncStatus.lastSyncTime).toLocaleTimeString("id-ID")
                    : "Belum ada"}
                </div>
                <p className="text-sm text-muted-foreground">Sinkronisasi Terakhir</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-blue-200 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Camera className="w-5 h-5" />
                Kamera Langsung
              </CardTitle>
              <CardDescription>Ambil foto survei sekarang</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/survey/upload?action=camera")} 
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-6 gap-2 shadow-lg"
              >
                <Camera className="w-6 h-6" />
                BUKA KAMERA
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
