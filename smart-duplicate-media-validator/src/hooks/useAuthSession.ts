"use client"

import { useSession } from "next-auth/react"
import { BYPASS_AUTH, mockTestUser } from "@/lib/test-auth"

export function useAuthSession() {
  // If bypass is enabled, return mock session without calling useSession
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    return {
      data: { user: mockTestUser },
      status: 'authenticated' as const
    }
  }
  
  // Otherwise use real session
  try {
    return useSession()
  } catch (error) {
    console.error('useSession error:', error)
    // Fallback to unauthenticated state
    return {
      data: null,
      status: 'unauthenticated' as const
    }
  }
}