import type React from "react"
import { AuthProvider } from "@/components/auth-provider"
import { SyncManagerInit } from "@/components/sync-manager-init"

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SyncManagerInit />
      <AuthProvider>{children}</AuthProvider>
    </>
  )
}
