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
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout} 
      className="h-8 px-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-bold uppercase tracking-tighter text-[10px]"
    >
      <LogOut className="w-3.5 h-3.5 mr-2" />
      Sign Out
    </Button>
  )
}
