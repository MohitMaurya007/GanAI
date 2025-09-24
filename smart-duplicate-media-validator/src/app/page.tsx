import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Search, Shield, Zap, Eye, Brain } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Smart Duplicate Media Validator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Intelligently detect and validate duplicate media files using advanced AI/ML techniques including 
            facial recognition, scene analysis, object detection, and audio fingerprinting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Brain className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>AI-Powered Detection</CardTitle>
              <CardDescription>
                Advanced machine learning models for facial recognition, object detection, and scene analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-green-200 transition-colors">
            <CardHeader>
              <Upload className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle>Flexible Upload</CardTitle>
              <CardDescription>
                Support for local files, cloud storage integration (Google Drive, Dropbox, S3)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardHeader>
              <Eye className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle>Visual Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison with similarity scores and confidence levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-orange-200 transition-colors">
            <CardHeader>
              <Search className="h-12 w-12 text-orange-600 mb-2" />
              <CardTitle>Multi-Media Support</CardTitle>
              <CardDescription>
                Process images, videos, and audio files with specialized algorithms for each type
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-red-200 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mb-2" />
              <CardTitle>Privacy-First</CardTitle>
              <CardDescription>
                Optional on-device processing and secure server-side isolation for sensitive media
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-teal-200 transition-colors">
            <CardHeader>
              <Zap className="h-12 w-12 text-teal-600 mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Admin, Standard User, and Reviewer roles with appropriate permissions and workflows
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of users who trust our AI-powered duplicate detection system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/signup">
                  Create Your Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
