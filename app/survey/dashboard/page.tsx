"use client"

import { useRouter } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Upload, BarChart3, Wifi, WifiOff, Camera, RefreshCw, Folder as FolderIcon, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { FolderManager } from "@/components/folder-manager"
import { getFolders } from "@/lib/indexeddb"
import { Badge } from "@/components/ui/badge"

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="SEIIKI" className="h-8 w-auto" />
            <h1 className="text-sm font-bold uppercase tracking-widest hidden sm:block">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-tight ${
              isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero / Welcome */}
        <div className="mb-12 border-b border-border pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <Badge variant="outline" className="font-mono text-[10px] uppercase px-1.5 py-0 h-4 mb-2">SYSTEM ACCESS GRANTED</Badge>
              <h2 className="text-4xl font-bold tracking-tighter">Welcome, {user.username}</h2>
              <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
                {user.role === "admin" 
                  ? "Manage all survey data, user activities, and system statistics from this central console." 
                  : "Collect field data, manage survey folders, and sync your findings with the central database."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/survey/upload")} className="rounded-full px-6 font-bold uppercase text-[11px] tracking-widest">
                <Plus className="w-4 h-4 mr-2" />
                New Survey
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard 
            label="Pending Sync" 
            value={syncStatus.totalPending} 
            description="Photos waiting for connection" 
            icon={<Upload size={16} />}
            urgent={syncStatus.totalPending > 0}
          />
          <StatCard 
            label="Cloud Photos" 
            value={stats ? stats.totalPhotos : "0"} 
            description="Total synced to server" 
            icon={<BarChart3 size={16} />}
          />
          <StatCard 
            label="Folders" 
            value={folderStats.total} 
            description="Active survey containers" 
            icon={<FolderIcon size={16} />}
          />
          <StatCard 
            label="Sync State" 
            value={syncStatus.isSyncing ? "Syncing" : "Active"} 
            description={syncStatus.isSyncing ? "Transferring data..." : "System is idle"} 
            icon={<RefreshCw size={16} className={syncStatus.isSyncing ? "animate-spin" : ""} />}
            active={syncStatus.isSyncing}
          />
        </div>

        {/* Folder Management */}
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Survey Folders</h3>
            <div className="h-px bg-border flex-1" />
          </div>
          <FolderManager />
        </div>

        {/* Quick Actions (Admin) */}
        {user.role === "admin" && (
          <div className="mt-20 pt-10 border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6">Administrative</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => router.push("/admin")} 
                className="group flex flex-col items-start p-8 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all text-left"
              >
                <div className="p-3 bg-secondary rounded-lg mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 size={20} />
                </div>
                <h4 className="font-bold text-lg tracking-tight mb-2 uppercase">Open Admin Panel</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Analyze all collected data, export reports, and manage high-level system configurations.</p>
              </button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-border mt-20">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
          &copy; 2026 FIELD SURVEY SYSTEM. BUILT WITH VERCEL DESIGN PRINCIPLES.
        </p>
      </footer>
    </div>
  )
}

function StatCard({ label, value, description, icon, urgent, active }: { label: string, value: string | number, description: string, icon: React.ReactNode, urgent?: boolean, active?: boolean }) {
  return (
    <div className={`p-6 border rounded-xl transition-all ${
      urgent ? "bg-amber-500/5 border-amber-500/20" : 
      active ? "bg-emerald-500/5 border-emerald-500/20" : 
      "bg-card/50 border-border hover:border-foreground/20"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="text-3xl font-bold tracking-tighter mb-1">{value}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{description}</p>
    </div>
  )
}
