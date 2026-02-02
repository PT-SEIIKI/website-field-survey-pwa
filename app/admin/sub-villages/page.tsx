"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Trash2, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminSubVillagesPage() {
  const router = useRouter()
  const [villages, setVillages] = useState<any[]>([])
  const [subVillages, setSubVillages] = useState<any[]>([])
  const [name, setName] = useState("")
  const [villageId, setVillageId] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchData = async () => {
    const [vRes, svRes] = await Promise.all([
      fetch("/api/villages"),
      fetch("/api/sub-villages")
    ])
    if (vRes.ok) setVillages(await vRes.json())
    if (svRes.ok) setSubVillages(await svRes.json())
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PATCH" : "POST"
    const url = editingId ? `/api/admin/sub-villages/${editingId}` : "/api/admin/sub-villages"
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, villageId: parseInt(villageId) })
    })

    if (res.ok) {
      setName(""); setVillageId(""); setEditingId(null)
      fetchData()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus dusun ini?")) return
    const res = await fetch(`/api/admin/sub-villages/${id}`, { method: "DELETE" })
    if (res.ok) fetchData()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button>
        <h1 className="text-2xl font-bold">Kelola Dusun</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? "Edit Dusun" : "Tambah Dusun Baru"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              required
            >
              <option value="">Pilih Desa</option>
              {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <Input placeholder="Nama Dusun" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingId ? "Simpan" : "Tambah"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => {setEditingId(null); setName(""); setVillageId("")}}>Batal</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Dusun</TableHead>
            <TableHead>Desa</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subVillages.map(sv => (
            <TableRow key={sv.id}>
              <TableCell>{sv.name}</TableCell>
              <TableCell>{villages.find(v => v.id === sv.villageId)?.name}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="ghost" onClick={() => {setEditingId(sv.id); setName(sv.name); setVillageId(sv.villageId.toString())}}><Edit2 className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(sv.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}