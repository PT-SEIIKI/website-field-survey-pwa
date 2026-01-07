"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("surveyUserLogin")

    if (isLoggedIn) {
      router.push("/survey/dashboard")
    } else {
      router.push("/login")
    }
    setIsLoaded(true)
  }, [router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Survey PWA</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
