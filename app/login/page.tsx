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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <h1 className="text-2xl font-bold">Survey PWA</h1>
          </div>
          <CardTitle>Login</CardTitle>
          <CardDescription>Masuk dengan akun Anda untuk memulai survei lapangan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
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
              />
              <p className="text-xs text-muted-foreground">Demo: password123 atau admin123</p>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1">
            <p className="font-medium text-blue-900">Demo Credentials:</p>
            <p className="text-blue-800">
              <strong>Surveyor:</strong> surveyor1 / password123
            </p>
            <p className="text-blue-800">
              <strong>Admin:</strong> admin / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
