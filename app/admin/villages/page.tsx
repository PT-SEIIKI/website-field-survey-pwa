"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminVillagesPage() {
  const router = useRouter()
  const [villages, setVillages] = useState<any[]>([])
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchVillages = async () => {
    const res = await fetch("/api/villages")
    if (res.ok) setVillages(await res.json())
  }

  useEffect(() => {
    fetchVillages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editingId ? "PATCH" : "POST"
    const url = editingId ? `/api/admin/villages/${editingId}` : "/api/admin/villages"
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    })

    if (res.ok) {
      setName("")
      setEditingId(null)
      fetchVillages()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus desa ini?")) return
    const res = await fetch(`/api/admin/villages/${id}`, { method: "DELETE" })
    if (res.ok) fetchVillages()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button>
        <h1 className="text-2xl font-bold">Kelola Desa</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>{editingId ? "Edit Desa" : "Tambah Desa Baru"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input 
              placeholder="Nama Desa" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            <Button type="submit">{editingId ? "Simpan" : "Tambah"}</Button>
            {editingId && <Button type="button" variant="outline" onClick={() => {setEditingId(null); setName("")}}>Batal</Button>}
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Desa</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {villages.map(v => (
            <TableRow key={v.id}>
              <TableCell>{v.name}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="ghost" onClick={() => {setEditingId(v.id); setName(v.name)}}><Edit2 className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}