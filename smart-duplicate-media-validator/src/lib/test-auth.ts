// Test authentication bypass for development
import { UserRole } from "@/types/user"

// Set to true to bypass authentication for testing
export const BYPASS_AUTH = true

// Mock user session for testing
export const mockTestUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: UserRole.ADMIN, // You can change this to STANDARD_USER or REVIEWER
  image: null
}

export const mockTestSession = {
  user: mockTestUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
}