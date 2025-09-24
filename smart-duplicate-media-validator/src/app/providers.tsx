"use client"

import { SessionProvider } from "next-auth/react"
import { BYPASS_AUTH } from "@/lib/test-auth"

export function Providers({ children }: { children: React.ReactNode }) {
  // If bypass is enabled, skip SessionProvider to avoid NextAuth API calls
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    console.log("🚨 AUTH BYPASS: Skipping SessionProvider")
    return <>{children}</>
  }
  
  return (
    <SessionProvider
      // Disable refetch on window focus to avoid unnecessary API calls
      refetchOnWindowFocus={false}
      // Handle session errors gracefully
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}