"use client"

import { useState, useEffect } from "react"
import { Plus, Folder as FolderIcon, Home, CreditCard, Trash2, Edit2, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { saveFolder, getFolders, deleteFolder } from "@/lib/indexeddb"
import { v4 as uuidv4 } from "uuid"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useRouter } from "next/navigation"

interface Folder {
  id: string
  name: string
  houseName?: string
  nik?: string
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

  // Form states
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
    
    // Simple validation
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
      if (isOnline && editingFolder?.syncStatus === "synced") {
        const res = await fetch("/api/folders")
        if (res.ok) {
          const serverFolders = await res.json()
          const serverFolder = serverFolders.find((f: any) => f.offlineId === folderData.id)
          if (serverFolder) {
            await fetch(`/api/folders/${serverFolder.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                houseName,
                nik
              })
            })
          }
        }
      }
      await saveFolder(folderData)
      await loadFolders()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving folder:", error)
    }
  }

  const handleDelete = async (folder: Folder) => {
    const id = folder.id
    if (confirm("Hapus folder ini? Semua data di dalamnya akan dipindahkan ke kategori 'Tanpa Folder'.")) {
      try {
        // Find the folder ID from backend if synced
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-sm sm:text-base lg:text-xl font-black text-blue-700 flex items-center gap-2">
          <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          MANAJEMEN FOLDER
        </h2>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Cari folder, nama, atau NIK..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 sm:h-10 text-xs w-full sm:w-64"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm" className="h-8 sm:h-10 gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                FOLDER BARU
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingFolder ? "Edit Folder" : "Buat Folder Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Folder</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Blok A - Sektor 1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseName">Nama Rumah / Pemilik</Label>
                <Input id="houseName" value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="Nama Pemilik" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (Opsional)</Label>
                <Input id="nik" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="16 Digit NIK" maxLength={16} />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-10 sm:h-12 text-xs sm:text-sm font-black">
                  {editingFolder ? "SIMPAN PERUBAHAN" : "BUAT FOLDER"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
        </div>
      ) : folders.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="py-6 sm:py-10 text-center">
            <FolderIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Belum ada folder. Buat folder untuk mengelompokkan hasil survei.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {filteredFolders.map((folder) => (
            <Card key={folder.id} className="group hover:border-blue-300 transition-all cursor-pointer overflow-hidden" onClick={() => router.push(`/survey/upload?folderId=${folder.id}`)}>
              <CardHeader className="p-3 sm:p-4 pb-0">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FolderIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={(e) => { e.stopPropagation(); handleOpenDialog(folder); }} variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button onClick={(e) => { e.stopPropagation(); handleDelete(folder); }} variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-bold mb-1 truncate">{folder.name}</CardTitle>
                <div className="space-y-1">
                  {folder.houseName && (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                      <Home className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="truncate">{folder.houseName}</span>
                    </div>
                  )}
                  {folder.nik && (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                      <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{folder.nik}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    folder.syncStatus === "synced" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {folder.syncStatus === "synced" ? "Synced" : "Offline"}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
