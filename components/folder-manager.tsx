"use client"

import { useState, useEffect } from "react"
import { Plus, Folder as FolderIcon, Home, CreditCard, Trash2, Edit2, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { saveFolder, getFolders, deleteFolder } from "@/lib/indexeddb"
import { v4 as uuidv4 } from "uuid"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Folder {
  id: string
  name: string
  houseName?: string
  nik?: string
  villageId?: number
  subVillageId?: number
  houseId?: number
  createdAt: number
  syncStatus: "pending" | "synced"
}

export function FolderManager() {
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const isOnline = useOnlineStatus()

  const [name, setName] = useState("")
  const [houseName, setHouseName] = useState("")
  const [nik, setNik] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadFolders()
  }, [])

  async function loadFolders() {
    setIsLoading(true)
    try {
      const data = await getFolders()
      setFolders(data.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error("Error loading folders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setHouseName("")
    setNik("")
    setEditingFolder(null)
  }

  const handleOpenDialog = (folder?: Folder) => {
    if (folder) {
      setEditingFolder(folder)
      setName(folder.name)
      setHouseName(folder.houseName || "")
      setNik(folder.nik || "")
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (nik && !/^\d{16}$/.test(nik)) {
      alert("NIK harus 16 digit angka.")
      return
    }

    const folderData: Folder = {
      id: editingFolder?.id || uuidv4(),
      name: name.trim(),
      houseName: houseName.trim(),
      nik: nik.trim(),
      createdAt: editingFolder?.createdAt || Date.now(),
      syncStatus: "pending",
    }

    try {
      await saveFolder(folderData)
      await loadFolders()
      
      if (isOnline) {
        // Trigger sync manually if online
        import("@/lib/sync-manager").then(({ startSync }) => startSync())
      }
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving folder:", error)
    }
  }

  const handleDelete = async (folder: Folder) => {
    const id = folder.id
    if (confirm("Hapus folder ini?")) {
      try {
        if (isOnline && folder.syncStatus === "synced") {
          const res = await fetch("/api/folders")
          if (res.ok) {
            const serverFolders = await res.json()
            const serverFolder = serverFolders.find((f: any) => f.offlineId === id)
            if (serverFolder) {
              await fetch(`/api/folders/${serverFolder.id}`, { method: "DELETE" })
            }
          }
        }
        await deleteFolder(id)
        await loadFolders()
      } catch (error) {
        console.error("Error deleting folder:", error)
      }
    }
  }

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (f.houseName && f.houseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.nik && f.nik.includes(searchTerm))
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari folder, NIK, atau nama..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-sm bg-background/50 border-border focus:ring-1 focus:ring-foreground transition-all"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} variant="outline" className="h-10 rounded-full px-6 border-border font-bold uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4 mr-2" />
              Buat Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-background border-border p-8 rounded-2xl shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight uppercase">{editingFolder ? "Edit Folder" : "Folder Baru"}</DialogTitle>
              <CardDescription className="text-xs">Masukkan detail kontainer survey di bawah ini.</CardDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Nama Folder</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Blok A - Sektor 1" className="h-10 bg-secondary/20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="houseName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Nama Pemilik</Label>
                  <Input id="houseName" value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="Nama Pemilik Rumah" className="h-10 bg-secondary/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">NIK (16 Digit)</Label>
                  <Input id="nik" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="16 Digit NIK" maxLength={16} className="h-10 bg-secondary/20" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest text-[11px]">
                  {editingFolder ? "Simpan Perubahan" : "Buat Folder"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-secondary/10">
          <FolderIcon className="w-10 h-10 text-muted-foreground/20 mb-4" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Tidak ada folder aktif ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFolders.map((folder) => (
            <div 
              key={folder.id} 
              className="group relative flex flex-col p-6 rounded-xl border border-border bg-card/50 hover:bg-secondary/30 transition-all cursor-pointer" 
              onClick={() => router.push(`/survey/folder/${folder.id}`)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderIcon size={18} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenDialog(folder); }} 
                    className="p-1.5 rounded-md hover:bg-foreground hover:text-background transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(folder); }} 
                    className="p-1.5 rounded-md hover:bg-destructive hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h4 className="text-lg font-bold tracking-tight uppercase truncate">{folder.name}</h4>
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground uppercase font-medium">
                  {folder.houseName && (
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3 h-3" />
                      {folder.houseName}
                    </span>
                  )}
                  {folder.nik && (
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      {folder.nik}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="outline" className={`font-mono text-[9px] px-1.5 h-4 border-none ${
                  folder.syncStatus === "synced" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                }`}>
                  {folder.syncStatus === "synced" ? "SYNCED" : "OFFLINE"}
                </Badge>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {new Date(folder.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
