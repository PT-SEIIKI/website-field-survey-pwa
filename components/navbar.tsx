"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { SyncManagerInit } from "@/components/sync-manager-init"
import {
  Menu,
  X,
  Home,
  Camera,
  Users,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  FolderOpen,
  Image,
  UserPlus,
  Shield
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  adminOnly?: boolean
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const isOnline = useOnlineStatus()
  const syncStatus = useSyncStatus()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsAdminUser(isAdmin())
  }, [])

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/survey/dashboard",
      icon: <Home className="w-4 h-4" />
    },
    {
      label: "Survey Lapangan",
      href: "/survey/upload",
      icon: <Camera className="w-4 h-4" />
    },
    {
      label: "Galeri",
      href: "/survey/gallery",
      icon: <Image className="w-4 h-4" />
    },
    {
      label: "Admin",
      href: "/admin",
      icon: <Shield className="w-4 h-4" />,
      adminOnly: true
    },
    {
      label: "Manajemen User",
      href: "/admin/users",
      icon: <UserPlus className="w-4 h-4" />,
      adminOnly: true
    }
  ]

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdminUser)

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <SyncManagerInit />
      {/* Desktop & Mobile Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SEIIKI" className="h-6 w-auto" />
              <div className="hidden sm:block h-4 w-px bg-border" />
              <h1 className="hidden sm:block text-sm font-bold uppercase tracking-widest">
                {isAdminUser ? "Portal Admin" : "Survey Portal"}
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavClick(item.href)}
                  className="gap-2 h-9"
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Right Section - Status & Actions */}
            <div className="flex items-center gap-2">
              {/* Sync Status Badge - Desktop Only */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                
                {syncStatus.totalPending > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {syncStatus.totalPending} pending
                  </Badge>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </Button>

              {/* Logout Button - Desktop Only */}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              {/* Mobile Status Info */}
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-xs">
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                
                {syncStatus.totalPending > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {syncStatus.totalPending} pending
                  </Badge>
                )}
              </div>

              {/* Mobile Navigation Items */}
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavClick(item.href)}
                  className="w-full justify-start gap-3 h-10"
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              ))}

              {/* Mobile Logout */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("surveyUserLogin")
                    router.push("/login")
                  }}
                  className="w-full justify-start gap-3 h-10"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
