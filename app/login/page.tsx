"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { initializeDefaultUsers, login } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TutorialDialog } from "@/components/tutorial-dialog"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src="/logo.png" alt="SEIIKI Logo" className="h-20 w-auto" />
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
              Survey PWA v1.0
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter">Login to Portal</h1>
            <p className="text-sm text-muted-foreground font-medium">
              PT. SOLUSI ENERGI KELISTRIKAN INDONESIA
            </p>
          </div>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Selamat Datang</CardTitle>
            <CardDescription className="text-xs">
              Gunakan kredensial demo untuk mencoba fitur sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="surveyor1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  className="h-10 bg-background/50 border-border focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-10 bg-background/50 border-border focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-[11px] font-medium text-destructive animate-in fade-in zoom-in-95">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-10 font-bold uppercase tracking-widest text-[11px]" 
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>

            <div className="pt-6 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-secondary/50 border border-border">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Surveyor</p>
                  <p className="text-[11px] font-mono truncate">surveyor1</p>
                  <p className="text-[10px] text-muted-foreground font-mono">password123</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/50 border border-border">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Admin</p>
                  <p className="text-[11px] font-mono truncate">admin</p>
                  <p className="text-[10px] text-muted-foreground font-mono">admin123</p>
                </div>
              </div>
              
              <div className="flex justify-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                <span className="flex items-center gap-1.5">• Offline Ready</span>
                <span className="flex items-center gap-1.5">• Secure Sync</span>
                <span className="flex items-center gap-1.5">• PWA</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center gap-4">
          <TutorialDialog />
          <p className="text-center text-[10px] text-muted-foreground font-mono">
            &copy; 2026 FIELD SURVEY SYSTEM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  )
}
