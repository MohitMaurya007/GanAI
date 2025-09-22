"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileImage, FileVideo, FileAudio, X, CheckCircle, AlertCircle } from "lucide-react"
import { formatBytes, getFileType } from "@/lib/utils"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect("/auth/signin")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const type = getFileType(file.name)
      return ['image', 'video', 'audio'].includes(type)
    })

    const uploadFiles: UploadFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    for (const uploadFile of files.filter(f => f.status === 'pending')) {
      try {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        ))

        const formData = new FormData()
        formData.append('file', uploadFile.file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
          ))
        } else {
          const error = await response.text()
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'error', error } : f
          ))
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'error', error: 'Upload failed' } : f
        ))
      }
    }
  }

  const getFileIcon = (filename: string) => {
    const type = getFileType(filename)
    switch (type) {
      case 'image': return <FileImage className="h-5 w-5" />
      case 'video': return <FileVideo className="h-5 w-5" />
      case 'audio': return <FileAudio className="h-5 w-5" />
      default: return <FileImage className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Media Files</h1>
          <p className="text-muted-foreground">
            Upload images, videos, or audio files to detect duplicates using AI
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>
              Drag and drop files or click to select. Supported formats: Images (JPG, PNG, GIF, WebP), 
              Videos (MP4, AVI, MOV), Audio (MP3, WAV, FLAC)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
              <p className="text-muted-foreground mb-4">
                or click to select files from your device
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Selected Files ({files.length})</CardTitle>
                <CardDescription>
                  Review your files before uploading
                </CardDescription>
              </div>
              <Button 
                onClick={uploadFiles} 
                disabled={files.every(f => f.status !== 'pending')}
              >
                Upload All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(uploadFile.file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(uploadFile.file.size)} • {getFileType(uploadFile.file.name)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        uploadFile.status === 'success' ? 'default' :
                        uploadFile.status === 'error' ? 'destructive' :
                        uploadFile.status === 'uploading' ? 'secondary' : 'outline'
                      }>
                        {uploadFile.status}
                      </Badge>
                      
                      {getStatusIcon(uploadFile.status)}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Upload Your Files</h4>
                <p className="text-sm text-muted-foreground">
                  Select and upload your media files. We support images, videos, and audio files.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI models analyze your files for facial features, objects, scenes, and audio patterns.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Review Results</h4>
                <p className="text-sm text-muted-foreground">
                  Review detected duplicates with similarity scores and validate the matches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}