import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-wrapper"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"
import { Navbar } from "@/components/layout/navbar"
import { DuplicatesList } from "@/components/duplicates/duplicates-list"
import { BYPASS_AUTH } from "@/lib/test-auth"

export default async function DuplicatesPage() {
  const session = await getAuthSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Get duplicates for the current user (use mock data if bypass is enabled)
  const duplicates = BYPASS_AUTH && process.env.NODE_ENV === 'development'
    ? []
    : await DuplicateDetectionService.getDuplicatesForUser(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Duplicate Media Review</h1>
          <p className="text-muted-foreground">
            Review and validate detected duplicate matches
          </p>
        </div>

        <DuplicatesList duplicates={duplicates} />
      </main>
    </div>
  )
}