import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-wrapper"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"
import { db } from "@/lib/db"
import { Navbar } from "@/components/layout/navbar"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const session = await getAuthSession()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  // Get system statistics
  const stats = await DuplicateDetectionService.getSystemStats()
  
  // Get recent users
  const recentUsers = await db.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          mediaFiles: true
        }
      }
    }
  })

  // Get detection config
  const detectionConfig = await DuplicateDetectionService.getDetectionConfig()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage system settings, users, and duplicate detection configuration
          </p>
        </div>

        <AdminDashboard 
          stats={stats}
          recentUsers={recentUsers}
          detectionConfig={detectionConfig}
        />
      </main>
    </div>
  )
}