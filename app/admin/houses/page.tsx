"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Trash2, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminHousesPage() {
  const router = useRouter()
  const [subVillages, setSubVillages] = useState<any[]>([])
  const [houses, setHouses] = useState<any[]>([])
  const [name, setName] = useState("")
  const [subVillageId, setSubVillageId] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchData = async () => {
    const [svRes, hRes] = await Promise.all([
      fetch("/api/sub-villages"),
      fetch("/api/houses")
    ])
    if (svRes.ok) setSubVillages(await svRes.ok ? await svRes.json() : [])
    if (hRes.ok) setHouses(await hRes.ok ? await hRes.json() : [])
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PATCH" : "POST"
    const url = editingId ? `/api/admin/houses/${editingId}` : "/api/admin/houses"
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subVillageId: parseInt(subVillageId) })
    })

    if (res.ok) {
      setName(""); setSubVillageId(""); setEditingId(null)
      fetchData()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rumah ini?")) return
    const res = await fetch(`/api/admin/houses/${id}`, { method: "DELETE" })
    if (res.ok) fetchData()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button>
        <h1 className="text-2xl font-bold">Kelola Rumah</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? "Edit Rumah" : "Tambah Rumah Baru"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
              value={subVillageId}
              onChange={(e) => setSubVillageId(e.target.value)}
              required
            >
              <option value="">Pilih Dusun</option>
              {subVillages.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
            </select>
            <Input placeholder="Nama Rumah / Pemilik" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingId ? "Simpan" : "Tambah"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => {setEditingId(null); setName(""); setSubVillageId("")}}>Batal</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Rumah</TableHead>
            <TableHead>Dusun</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {houses.map(h => (
            <TableRow key={h.id}>
              <TableCell>{h.name}</TableCell>
              <TableCell>{subVillages.find(sv => sv.id === h.subVillageId)?.name}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="ghost" onClick={() => {setEditingId(h.id); setName(h.name); setSubVillageId(h.subVillageId.toString())}}><Edit2 className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}