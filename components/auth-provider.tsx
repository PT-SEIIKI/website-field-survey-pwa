"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
    }
  }, [router])

  return <>{children}</>
}
