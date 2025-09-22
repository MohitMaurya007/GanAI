"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { 
  Users, 
  FileImage, 
  Search, 
  CheckCircle, 
  XCircle, 
  Settings,
  TrendingUp,
  Database,
  Brain
} from "lucide-react"

interface AdminDashboardProps {
  stats: {
    totalFiles: number
    totalDuplicates: number
    pendingReview: number
    autoApproved: number
    userValidated: number
    accuracyRate: number
  }
  recentUsers: Array<{
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
    _count: {
      mediaFiles: number
    }
  }>
  detectionConfig: {
    minSimilarityThreshold: number
    minConfidenceThreshold: number
    enabledMethods: string[]
    autoApproveThreshold: number
  }
}

export function AdminDashboard({ stats, recentUsers, detectionConfig }: AdminDashboardProps) {
  const [config, setConfig] = useState(detectionConfig)
  const [isSaving, setIsSaving] = useState(false)

  const handleConfigUpdate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        console.log('Configuration updated successfully')
      } else {
        console.error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Error updating configuration:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMethod = (method: string) => {
    setConfig(prev => ({
      ...prev,
      enabledMethods: prev.enabledMethods.includes(method)
        ? prev.enabledMethods.filter(m => m !== method)
        : [...prev.enabledMethods, method]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicates Found</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDuplicates}</div>
            <p className="text-xs text-muted-foreground">
              AI-detected matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.accuracyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              User validation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Status</CardTitle>
                <CardDescription>
                  Breakdown of duplicate match statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Auto-Approved</span>
                    </div>
                    <Badge variant="secondary">{stats.autoApproved}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>User Validated</span>
                    </div>
                    <Badge variant="secondary">{stats.userValidated}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-4 w-4 text-yellow-500" />
                      <span>Pending Review</span>
                    </div>
                    <Badge variant="secondary">{stats.pendingReview}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>AI Processing</span>
                    <Badge className="bg-green-500">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <Badge className="bg-green-500">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage</span>
                    <Badge className="bg-green-500">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Latest user registrations and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Files Uploaded</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'ADMIN' ? 'default' :
                          user.role === 'REVIEWER' ? 'secondary' : 'outline'
                        }>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{user._count.mediaFiles}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Detection Configuration</CardTitle>
              <CardDescription>
                Adjust AI model thresholds and detection methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Minimum Similarity Threshold: {config.minSimilarityThreshold}%</Label>
                  <Slider
                    value={[config.minSimilarityThreshold]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, minSimilarityThreshold: value }))}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum similarity score required to flag as duplicate
                  </p>
                </div>

                <div>
                  <Label>Minimum Confidence Threshold: {config.minConfidenceThreshold}%</Label>
                  <Slider
                    value={[config.minConfidenceThreshold]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, minConfidenceThreshold: value }))}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum AI confidence level required
                  </p>
                </div>

                <div>
                  <Label>Auto-Approve Threshold: {config.autoApproveThreshold}%</Label>
                  <Slider
                    value={[config.autoApproveThreshold]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, autoApproveThreshold: value }))}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically approve matches above this threshold
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Detection Methods</Label>
                <div className="mt-3 space-y-3">
                  {[
                    { key: 'FACIAL_RECOGNITION', label: 'Facial Recognition', icon: Users },
                    { key: 'OBJECT_DETECTION', label: 'Object Detection', icon: Search },
                    { key: 'SCENE_SIMILARITY', label: 'Scene Similarity', icon: FileImage },
                    { key: 'AUDIO_FINGERPRINT', label: 'Audio Fingerprint', icon: Brain },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-3">
                      <Switch
                        checked={config.enabledMethods.includes(key)}
                        onCheckedChange={() => toggleMethod(key)}
                      />
                      <Icon className="h-4 w-4" />
                      <Label>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleConfigUpdate} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                Performance metrics and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">Charts and detailed metrics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}