"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  XCircle, 
  Archive, 
  Trash2, 
  Eye, 
  FileImage, 
  FileVideo, 
  FileAudio,
  Brain,
  Users,
  Scan,
  Volume2,
  MessageSquare
} from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface DuplicateMatch {
  id: string
  originalFileId: string
  duplicateFileId: string
  similarityScore: number
  confidenceLevel: number
  method: string
  status: string
  createdAt: string
  originalFile: {
    id: string
    filename: string
    originalName: string
    size: number
    type: string
    path: string
  }
  duplicateFile: {
    id: string
    filename: string
    originalName: string
    size: number
    type: string
    path: string
  }
  validations: Array<{
    id: string
    action: string
    notes: string | null
    validatedAt: string
    validator: {
      id: string
      name: string | null
      email: string
    }
  }>
}

interface DuplicatesListProps {
  duplicates: DuplicateMatch[]
}

export function DuplicatesList({ duplicates }: DuplicatesListProps) {
  const [selectedMatch, setSelectedMatch] = useState<DuplicateMatch | null>(null)
  const [validationNotes, setValidationNotes] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const handleValidation = async (matchId: string, action: string) => {
    setIsValidating(true)
    try {
      const response = await fetch(`/api/duplicates/${matchId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: validationNotes
        })
      })

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        console.error('Validation failed')
      }
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
      setValidationNotes("")
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'FACIAL_RECOGNITION': return <Users className="h-4 w-4" />
      case 'OBJECT_DETECTION': return <Scan className="h-4 w-4" />
      case 'SCENE_SIMILARITY': return <Eye className="h-4 w-4" />
      case 'AUDIO_FINGERPRINT': return <Volume2 className="h-4 w-4" />
      case 'SPEECH_RECOGNITION': return <MessageSquare className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image': return <FileImage className="h-5 w-5" />
      case 'video': return <FileVideo className="h-5 w-5" />
      case 'audio': return <FileAudio className="h-5 w-5" />
      default: return <FileImage className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'APPROVED': return 'bg-green-500'
      case 'REJECTED': return 'bg-red-500'
      case 'AUTO_APPROVED': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const groupedDuplicates = duplicates.reduce((groups, duplicate) => {
    const status = duplicate.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(duplicate)
    return groups
  }, {} as Record<string, DuplicateMatch[]>)

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
          <p className="text-muted-foreground">
            Upload some media files to start detecting duplicates with AI
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{duplicates.length}</div>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {groupedDuplicates.PENDING?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {(groupedDuplicates.APPROVED?.length || 0) + (groupedDuplicates.AUTO_APPROVED?.length || 0)}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {groupedDuplicates.REJECTED?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates List */}
      <Tabs defaultValue="PENDING" className="w-full">
        <TabsList>
          <TabsTrigger value="PENDING">
            Pending ({groupedDuplicates.PENDING?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            Approved ({(groupedDuplicates.APPROVED?.length || 0) + (groupedDuplicates.AUTO_APPROVED?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rejected ({groupedDuplicates.REJECTED?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PENDING" className="space-y-4">
          {groupedDuplicates.PENDING?.map((duplicate) => (
            <DuplicateCard 
              key={duplicate.id} 
              duplicate={duplicate} 
              onValidate={handleValidation}
              getMethodIcon={getMethodIcon}
              getFileIcon={getFileIcon}
              getStatusColor={getStatusColor}
            />
          )) || (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No pending duplicates</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="APPROVED" className="space-y-4">
          {[...(groupedDuplicates.APPROVED || []), ...(groupedDuplicates.AUTO_APPROVED || [])].map((duplicate) => (
            <DuplicateCard 
              key={duplicate.id} 
              duplicate={duplicate} 
              onValidate={handleValidation}
              getMethodIcon={getMethodIcon}
              getFileIcon={getFileIcon}
              getStatusColor={getStatusColor}
              readOnly
            />
          )) || (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No approved duplicates</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="REJECTED" className="space-y-4">
          {groupedDuplicates.REJECTED?.map((duplicate) => (
            <DuplicateCard 
              key={duplicate.id} 
              duplicate={duplicate} 
              onValidate={handleValidation}
              getMethodIcon={getMethodIcon}
              getFileIcon={getFileIcon}
              getStatusColor={getStatusColor}
              readOnly
            />
          )) || (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No rejected duplicates</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DuplicateCardProps {
  duplicate: DuplicateMatch
  onValidate: (matchId: string, action: string) => void
  getMethodIcon: (method: string) => React.ReactNode
  getFileIcon: (type: string) => React.ReactNode
  getStatusColor: (status: string) => string
  readOnly?: boolean
}

function DuplicateCard({ 
  duplicate, 
  onValidate, 
  getMethodIcon, 
  getFileIcon, 
  getStatusColor, 
  readOnly = false 
}: DuplicateCardProps) {
  const [notes, setNotes] = useState("")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getMethodIcon(duplicate.method)}
            <CardTitle className="text-lg">
              {duplicate.method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <Badge className={getStatusColor(duplicate.status) + " text-white"}>
              {duplicate.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(duplicate.createdAt).toLocaleDateString()}
          </div>
        </div>
        <CardDescription>
          Similarity: {duplicate.similarityScore.toFixed(1)}% • 
          Confidence: {duplicate.confidenceLevel.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original File */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center space-x-2">
              {getFileIcon(duplicate.originalFile.type)}
              <span>Original File</span>
            </h4>
            <div className="p-3 border rounded-lg">
              <p className="font-medium truncate">{duplicate.originalFile.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(duplicate.originalFile.size)} • {duplicate.originalFile.type}
              </p>
            </div>
          </div>

          {/* Duplicate File */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center space-x-2">
              {getFileIcon(duplicate.duplicateFile.type)}
              <span>Duplicate File</span>
            </h4>
            <div className="p-3 border rounded-lg">
              <p className="font-medium truncate">{duplicate.duplicateFile.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(duplicate.duplicateFile.size)} • {duplicate.duplicateFile.type}
              </p>
            </div>
          </div>
        </div>

        {/* Similarity Scores */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Similarity Score</span>
            <span>{duplicate.similarityScore.toFixed(1)}%</span>
          </div>
          <Progress value={duplicate.similarityScore} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>Confidence Level</span>
            <span>{duplicate.confidenceLevel.toFixed(1)}%</span>
          </div>
          <Progress value={duplicate.confidenceLevel} className="h-2" />
        </div>

        {/* Validation History */}
        {duplicate.validations.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold mb-2">Validation History</h5>
            <div className="space-y-2">
              {duplicate.validations.map((validation) => (
                <Alert key={validation.id}>
                  <AlertDescription>
                    <strong>{validation.validator.name || validation.validator.email}</strong> 
                    {" " + validation.action}d this match
                    {validation.notes && (
                      <span className="block mt-1 text-sm">"{validation.notes}"</span>
                    )}
                    <span className="block mt-1 text-xs text-muted-foreground">
                      {new Date(validation.validatedAt).toLocaleString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readOnly && duplicate.status === 'PENDING' && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Duplicate Match</DialogTitle>
                  <DialogDescription>
                    Confirm that these files are duplicates. Add optional notes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <Button 
                    onClick={() => onValidate(duplicate.id, 'approve')}
                    className="w-full"
                  >
                    Approve Match
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Duplicate Match</DialogTitle>
                  <DialogDescription>
                    Mark this as a false positive. The files are not duplicates.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reject-notes">Notes (optional)</Label>
                    <Textarea
                      id="reject-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Why is this not a duplicate?"
                    />
                  </div>
                  <Button 
                    onClick={() => onValidate(duplicate.id, 'reject')}
                    variant="outline"
                    className="w-full"
                  >
                    Reject Match
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Duplicate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Duplicate File</DialogTitle>
                  <DialogDescription>
                    This will permanently delete the duplicate file. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      The file "{duplicate.duplicateFile.originalName}" will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <Label htmlFor="delete-notes">Reason for deletion</Label>
                    <Textarea
                      id="delete-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Why are you deleting this file?"
                      required
                    />
                  </div>
                  <Button 
                    onClick={() => onValidate(duplicate.id, 'delete')}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete File
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}