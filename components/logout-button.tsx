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
      className="h-9 px-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border font-bold uppercase tracking-widest text-[10px] transition-all"
    >
      <LogOut className="w-3.5 h-3.5 mr-2" />
      Sign Out
    </Button>
  )
}
