import { NextRequest, NextResponse } from "next/server"
import { BYPASS_AUTH, mockTestSession } from "@/lib/test-auth"

export async function GET(request: NextRequest) {
  // If bypass is enabled, return mock session
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    return NextResponse.json(mockTestSession)
  }
  
  // Otherwise, proxy to NextAuth session endpoint
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    })
    
    const session = await response.json()
    return NextResponse.json(session)
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(null)
  }
}