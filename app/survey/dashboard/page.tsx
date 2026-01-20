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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                isOnline ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Selamat datang, {user.username}!</h2>
          <p className="text-gray-600 text-lg">
            {user.role === "admin" ? "Kelola semua data survei dan aktivitas pengguna" : "Kelola dan unggah survei lapangan Anda"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-md">
                <Upload size={20} className="text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{syncStatus.totalPending}</div>
            <p className="text-sm text-gray-600">Foto menunggu sinkronisasi</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-md ${isOnline ? "bg-green-50" : "bg-gray-100"}`}>
                {isOnline ? <Wifi size={20} className="text-green-600" /> : <WifiOff size={20} className="text-gray-700" />}
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${isOnline ? "text-green-600" : "text-gray-900"}`}>{isOnline ? "Online" : "Offline"}</div>
            <p className="text-sm text-gray-600">Status koneksi</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-md">
                <RefreshCw size={20} className={`text-gray-700 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{syncStatus.isSyncing ? "Sinkronisasi..." : "Siap"}</div>
            <p className="text-sm text-gray-600">Status sinkronisasi</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-md">
                <BarChart3 size={20} className="text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats ? stats.totalPhotos : "0"}</div>
            <p className="text-sm text-gray-600">Total foto tersinkronisasi</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-md">
                <FolderIcon size={20} className="text-gray-700" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{folderStats.total}</div>
            <p className="text-sm text-gray-600">Total folder</p>
          </div>
        </div>

        {/* Folder Management Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Folder Survei</h3>
          <FolderManager />
        </div>

        {/* Actions Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => router.push("/survey/upload")} 
            className="border border-gray-200 rounded-lg p-8 hover:border-gray-300 hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Upload size={24} className="text-gray-700" />
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 text-left mb-2">Upload Foto</h4>
            <p className="text-sm text-gray-600 text-left">Pilih foto dari galeri untuk diupload ke sistem</p>
          </button>

          {user.role === "admin" && (
            <button
              onClick={() => router.push("/admin")} 
              className="border border-gray-200 rounded-lg p-8 hover:border-gray-300 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                  <BarChart3 size={24} className="text-gray-700" />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 text-left mb-2">Admin Panel</h4>
              <p className="text-sm text-gray-600 text-left">Kelola semua data foto dalam sistem</p>
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
