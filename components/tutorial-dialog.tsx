"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Smartphone, Globe, Download, MousePointer2, CheckCircle2 } from "lucide-react"

export function TutorialDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-[10px] text-muted-foreground uppercase tracking-widest h-auto p-0 hover:text-foreground">
          Cara Menggunakan Aplikasi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight uppercase">Panduan Penggunaan</DialogTitle>
          <DialogDescription className="text-xs">
            Ikuti langkah-langkah di bawah untuk mengoptimalkan penggunaan SEIIKI Survey PWA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Section: Website Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Mode Website (Browser)</h3>
            </div>
            
            <div className="grid gap-3 ml-2 border-l-2 border-border pl-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-foreground/80">1. Akses Portal</p>
                <p className="text-xs text-muted-foreground">Buka browser dan masuk ke URL yang diberikan. Masukkan username dan password demo yang tersedia.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-foreground/80">2. Sinkronisasi Data</p>
                <p className="text-xs text-muted-foreground">Pastikan Anda memiliki koneksi internet saat pertama kali login untuk memuat data dasar.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-foreground/80">3. Kelola Folder</p>
                <p className="text-xs text-muted-foreground">Buat folder baru untuk setiap lokasi survey agar data tersusun rapi.</p>
              </div>
            </div>
          </div>

          {/* Section: PWA Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-md">
                <Smartphone className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Mode Aplikasi (PWA)</h3>
            </div>
            
            <div className="grid gap-4 ml-2 border-l-2 border-emerald-500/20 pl-4">
              <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-[11px] font-bold uppercase text-emerald-700">Instalasi (Sangat Disarankan)</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc ml-4">
                  <li><span className="font-bold text-emerald-700/80">Android/Chrome:</span> Klik menu (titik tiga) lalu pilih "Instal Aplikasi".</li>
                  <li><span className="font-bold text-emerald-700/80">iOS/Safari:</span> Klik tombol "Share" (kotak panah atas) lalu pilih "Add to Home Screen".</li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-foreground/80">Keunggulan Mode PWA:</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold uppercase">Offline Ready</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold uppercase">Full Screen</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold uppercase">Fast Loading</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold uppercase">Data Saving</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()} className="h-9 px-6 font-bold uppercase text-[10px] tracking-widest">
              Mengerti
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
