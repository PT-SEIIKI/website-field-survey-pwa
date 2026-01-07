import type React from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Note: In production, this check should be done server-side properly
  // For now this is a basic check

  return <>{children}</>
}
