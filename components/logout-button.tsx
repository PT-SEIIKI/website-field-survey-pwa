"use client"

import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
      <LogOut className="w-4 h-4" />
      Logout
    </Button>
  )
}
