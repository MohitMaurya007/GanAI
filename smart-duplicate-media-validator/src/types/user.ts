// User types that can be used both client and server side
export enum UserRole {
  ADMIN = "ADMIN",
  STANDARD_USER = "STANDARD_USER", 
  REVIEWER = "REVIEWER"
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: UserRole
  image?: string | null
}