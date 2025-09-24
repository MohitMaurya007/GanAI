import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-wrapper"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"
import { db } from "@/lib/db"
import { Navbar } from "@/components/layout/navbar"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { UserRole } from "@/types/user"
import { BYPASS_AUTH } from "@/lib/test-auth"

export default async function AdminPage() {
  const session = await getAuthSession()

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/auth/signin")
  }

  // Get system statistics (use mock data if bypass is enabled)
  const stats = BYPASS_AUTH && process.env.NODE_ENV === 'development' 
    ? {
        totalFiles: 0,
        totalDuplicates: 0,
        pendingReview: 0,
        autoApproved: 0,
        userValidated: 0,
        accuracyRate: 0
      }
    : await DuplicateDetectionService.getSystemStats()
  
  // Get recent users (use mock data if bypass is enabled)
  const recentUsers = BYPASS_AUTH && process.env.NODE_ENV === 'development'
    ? []
    : await db.user.findMany({
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

  // Get detection config (use mock data if bypass is enabled)
  const detectionConfig = BYPASS_AUTH && process.env.NODE_ENV === 'development'
    ? {
        minSimilarityThreshold: 75,
        minConfidenceThreshold: 80,
        enabledMethods: ['FACIAL_RECOGNITION', 'SCENE_SIMILARITY', 'OBJECT_DETECTION', 'AUDIO_FINGERPRINT'],
        autoApproveThreshold: 95
      }
    : await DuplicateDetectionService.getDetectionConfig()

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