import type React from "react"
import { AuthProvider } from "@/components/auth-provider"
import { SyncManagerInit } from "@/components/sync-manager-init"
import { Navbar } from "@/components/navbar"

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <AuthProvider>{children}</AuthProvider>
    </>
  )
}
