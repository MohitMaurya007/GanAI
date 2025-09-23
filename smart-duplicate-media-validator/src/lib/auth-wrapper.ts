// Authentication wrapper with test bypass
import { auth } from "./auth"
import { BYPASS_AUTH, mockTestSession } from "./test-auth"

export async function getAuthSession() {
  // If bypass is enabled, return mock session
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    console.log("🚨 AUTH BYPASS ENABLED - Using mock session for testing")
    return mockTestSession
  }
  
  // Otherwise use real authentication with error handling
  try {
    return await auth()
  } catch (error) {
    console.error("Auth session error:", error)
    // In case of auth errors, return null to allow proper error handling
    return null
  }
}