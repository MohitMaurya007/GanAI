import { getAuthSession } from "@/lib/auth-wrapper"
import { BYPASS_AUTH } from "@/lib/test-auth"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@/types/user"

export default async function TestAuthPage() {
  const session = await getAuthSession()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Authentication Test
              {BYPASS_AUTH && process.env.NODE_ENV === 'development' && (
                <Badge variant="destructive">🚨 BYPASS ACTIVE</Badge>
              )}
            </CardTitle>
            <CardDescription>
              This page shows the current authentication status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication Status</h3>
              <p className="text-sm text-muted-foreground">
                {session ? "✅ Authenticated" : "❌ Not authenticated"}
              </p>
            </div>

            {session && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {session.user.id}</p>
                    <p><strong>Name:</strong> {session.user.name || "Not provided"}</p>
                    <p><strong>Email:</strong> {session.user.email}</p>
                    <p><strong>Role:</strong> {session.user.role}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Access Permissions</h3>
                  <div className="space-y-1 text-sm">
                    <p>✅ Dashboard access</p>
                    <p>✅ File upload</p>
                    <p>✅ Duplicate review</p>
                    {(session.user.role === UserRole.ADMIN || session.user.role === UserRole.REVIEWER) && (
                      <p>✅ Admin panel access</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <h3 className="font-semibold mb-2">Bypass Configuration</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Bypass Enabled:</strong> {BYPASS_AUTH ? "✅ Yes" : "❌ No"}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                {BYPASS_AUTH && process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg mt-2">
                    <p className="text-orange-800 dark:text-orange-200 font-semibold">
                      🚨 Authentication bypass is active!
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
                      All protected routes and API endpoints will use the mock test user.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}