"use client";

import { useEffect, useState } from "react";
import { User, insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Username dan password harus diisi");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast.success("User berhasil ditambahkan");
        setIsAddOpen(false);
        setNewUser({ username: "", password: "", role: "user" });
        fetchUsers();
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Gagal menambahkan user");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus user ini?")) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("User berhasil dihapus");
          setUsers(users.filter(u => u.id !== id));
        } else {
          toast.error("Gagal menghapus user");
        }
      } catch (err) {
        toast.error("Gagal menghapus user");
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen User</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola akun surveyor dan administrator sistem.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold uppercase tracking-widest text-[11px] h-10 px-6">
              <UserPlus className="h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Tambah Akun Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                <Input 
                  value={newUser.username} 
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  placeholder="surveyor2"
                  className="h-10 bg-background/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                <Input 
                  type="password"
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  className="h-10 bg-background/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Role</label>
                <Select 
                  value={newUser.role} 
                  onValueChange={val => setNewUser({...newUser, role: val})}
                >
                  <SelectTrigger className="h-10 bg-background/50 border-border">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Surveyor (User)</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="h-10 font-bold uppercase tracking-widest text-[10px]">Batal</Button>
              <Button onClick={handleAddUser} disabled={isSubmitting} className="h-10 px-8 font-bold uppercase tracking-widest text-[10px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-xl bg-card/50 overflow-hidden shadow-xl shadow-black/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/20 border-none hover:bg-secondary/20">
              <TableHead className="font-bold uppercase tracking-widest text-[10px] py-4">Username</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] py-4">Role</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] py-4">Dibuat Pada</TableHead>
              <TableHead className="font-bold uppercase tracking-widest text-[10px] py-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Belum ada user.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group hover:bg-secondary/30 transition-colors border-border/50">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                      user.role === "admin" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-secondary-foreground border border-border"
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-mono uppercase">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(user.id)}
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                      disabled={user.username === "admin"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
