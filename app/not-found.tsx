"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push("/")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Halaman Tidak Ditemukan</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Halaman yang Anda cari tidak tersedia. Anda akan dialihkan ke halaman utama dalam beberapa detik.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Kembali ke Beranda
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 flex-1"
              >
                Login
              </button>
              
              <button
                onClick={() => router.push("/survey/dashboard")}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 flex-1"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>SEIIKI Survey PWA - Offline First</p>
        </div>
      </div>
    </div>
  )
}
