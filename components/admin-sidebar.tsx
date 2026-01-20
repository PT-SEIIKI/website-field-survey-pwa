"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link 
          href="/admin"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/admin" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link 
          href="/admin/users"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/admin/users" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
        >
          <Users className="h-4 w-4" />
          Manajemen User
        </Link>
      </nav>
      <div className="p-4 border-t">
        <button 
          onClick={() => {
            localStorage.removeItem("surveyUserLogin");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );
}
