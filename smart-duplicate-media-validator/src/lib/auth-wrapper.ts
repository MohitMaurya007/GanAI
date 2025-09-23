// Authentication wrapper with test bypass
import { auth } from "./auth"
import { BYPASS_AUTH, mockTestSession } from "./test-auth"

export async function getAuthSession() {
  // If bypass is enabled, return mock session
  if (BYPASS_AUTH && process.env.NODE_ENV === 'development') {
    console.log("🚨 AUTH BYPASS ENABLED - Using mock session for testing")
    return mockTestSession
  }
  
  // Otherwise use real authentication
  return await auth()
}