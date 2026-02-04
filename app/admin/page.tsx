"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Camera, UserPlus, Download } from "lucide-react"
import { ExportData } from "@/components/export-data"
import { Navbar } from "@/components/navbar"

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
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || !isAdmin()) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    loadStats()
    const interval = setInterval(() => {
      loadStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()
      if (data.success) setStats(data.stats)
    } catch (error) {
      console.error("Load stats error:", error)
    }
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground">
        <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-12 border-b border-border pb-10">
          <div className="flex flex-col gap-2 mb-8">
            <Badge variant="outline" className="w-fit font-mono text-[10px] uppercase px-1.5 py-0 h-4">AKSES SISTEM DIBERIKAN</Badge>
            <h2 className="text-4xl font-bold tracking-tighter text-foreground">Kontrol Admin</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mt-2">
              Anda memiliki akses administratif penuh. Anda dapat melakukan survey lapangan seperti surveyor atau mengelola semua data yang terkumpul dari antarmuka terpadu ini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <button
              onClick={() => router.push("/survey/upload")}
              className="group flex flex-col items-start p-6 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all text-left"
            >
              <div className="p-3 bg-secondary rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base tracking-tight mb-2 uppercase">Survey Lapangan</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Mulai survey lapangan baru, ambil foto, dan kumpulkan data lokasi secara langsung.</p>
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="group flex flex-col items-start p-6 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all text-left"
            >
              <div className="p-3 bg-secondary rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base tracking-tight mb-2 uppercase">Manajemen User</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Buat, perbarui, dan kelola pengguna sistem serta tingkat akses mereka.</p>
            </button>
            <button
              onClick={() => router.push("/survey/dashboard")}
              className="group flex flex-col items-start p-6 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all text-left"
            >
              <div className="p-3 bg-secondary rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base tracking-tight mb-2 uppercase">Dashboard Surveyor</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Akses dashboard sederhana surveyor untuk manajemen folder dan pengecekan status cepat.</p>
            </button>
            <button
              onClick={() => router.push("/survey/gallery")}
              className="group flex flex-col items-start p-6 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all text-left"
            >
              <div className="p-3 bg-secondary rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base tracking-tight mb-2 uppercase">Galeri Foto</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Lihat semua foto yang telah diupload berdasarkan lokasi dan waktu.</p>
            </button>
          </div>
          
          <div className="mt-12 p-8 rounded-xl border border-border bg-card/50">
            <ExportData />
          </div>
        </div>
      </main>
    </div>
    </>
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
