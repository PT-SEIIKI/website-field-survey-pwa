"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { initializeDefaultUsers, login } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize default users
    initializeDefaultUsers()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = login({ username, password })

      if (result.success) {
        router.push("/survey/dashboard")
      } else {
        setError(result.error || "Login gagal")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white dark:from-indigo-950 dark:via-background dark:to-background p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/20 dark:[mask-image:linear-gradient(0deg,transparent,black)] -z-10" />
      <Card className="w-full max-w-md border-0 bg-white/80 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 mx-4 sm:mx-auto">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <CardHeader className="space-y-1 pt-6 sm:pt-8 px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6 group justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-blue-500/30 transform transition-transform group-hover:rotate-12">
              S
            </div>
            <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-blue-400 dark:to-indigo-300 tracking-tight">
              Survey PWA
            </h1>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-center font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">Akses portal survei lapangan profesional Anda</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 sm:pb-8 px-4 sm:px-6">
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs">?</span>
              Quick Guide:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2 sm:space-y-2.5">
              <li className="flex gap-2">
                <span className="text-primary font-bold">01.</span>
                <span><strong>Roles:</strong> Surveyor untuk lapangan, Admin untuk rekap.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">02.</span>
                <span><strong>Capture:</strong> Ambil foto langsung dari lokasi.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">03.</span>
                <span><strong>Offline:</strong> Data aman tersimpan tanpa koneksi.</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground">Demo: surveyor1 atau admin</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground">Demo: password123 atau admin123</p>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1">
            <p className="font-medium text-blue-900 text-sm">Demo Credentials:</p>
            <p className="text-blue-800 text-xs sm:text-sm">
              <strong>Surveyor:</strong> surveyor1 / password123
            </p>
            <p className="text-blue-800 text-xs sm:text-sm">
              <strong>Admin:</strong> admin / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
