'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  MediaFile, 
  DuplicateGroup, 
  ScanProgress as ScanProgressType, 
  FilterOptions 
} from '@/types/media';

// Import redesigned components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';

import { 
  Search, 
  Upload,
  FolderOpen,
  Zap,
  BarChart3,
  Download,
  Settings,
  FileImage,
  Video,
  CheckCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  HardDrive
} from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<'upload' | 'scan' | 'results'>('upload');
  const [sessionId, setSessionId] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<ScanProgressType | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [directoryPath, setDirectoryPath] = useState('');

  // Initialize session ID
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Mock data for demonstration
  const mockStats = {
    totalFiles: allFiles.length,
    duplicateGroups: duplicateGroups.length,
    totalDuplicateFiles: duplicateGroups.reduce((sum, group) => sum + group.files.length, 0),
    potentialSpaceSaved: duplicateGroups.reduce((total, group) => {
      if (group.files.length <= 1) return total;
      const primarySize = group.primaryFile?.size || 0;
      const totalSize = group.files.reduce((sum, file) => sum + file.size, 0);
      return total + (totalSize - primarySize);
    }, 0)
  };

  const handleStartScan = async (type: 'upload' | 'directory') => {
    setIsScanning(true);
    setCurrentView('scan');
    
    // Mock scan progress for demonstration
    setScanProgress({
      total: 100,
      processed: 0,
      current: 'Starting scan...',
      stage: 'scanning',
      duplicatesFound: 0
    });

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (!prev) return null;
        const newProcessed = prev.processed + Math.random() * 10;
        if (newProcessed >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setCurrentView('results');
          // Mock some duplicate groups for demonstration
          setDuplicateGroups([
            {
              id: '1',
              files: [
                {
                  id: '1a',
                  name: 'IMG_001.jpg',
                  path: '/photos/IMG_001.jpg',
                  size: 2048576,
                  type: 'image',
                  mimeType: 'image/jpeg',
                  hash: 'abc123',
                  createdAt: new Date(),
                  modifiedAt: new Date(),
                  tags: [],
                  source: 'local'
                },
                {
                  id: '1b',
                  name: 'IMG_001_copy.jpg',
                  path: '/photos/backup/IMG_001_copy.jpg',
                  size: 2048576,
                  type: 'image',
                  mimeType: 'image/jpeg',
                  hash: 'abc123',
                  createdAt: new Date(),
                  modifiedAt: new Date(),
                  tags: [],
                  source: 'local'
                }
              ],
              type: 'exact',
              similarity: 100,
              createdAt: new Date(),
              verified: false
            }
          ]);
          return {
            ...prev,
            processed: 100,
            stage: 'complete',
            duplicatesFound: 1
          };
        }
        return {
          ...prev,
          processed: Math.min(newProcessed, 100),
          current: `Processing file ${Math.floor(newProcessed)}...`
        };
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Duplicate Media Detector
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered duplicate detection with advanced algorithms
                </p>
              </div>
            </div>
            
            {currentView === 'results' && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {mockStats.duplicateGroups} duplicate groups found
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    {formatBytes(mockStats.potentialSpaceSaved)} can be saved
                  </p>
                </div>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload View */}
        {currentView === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                Powered by AI
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                Find and Remove Duplicate Media Files
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload your media files or scan directories to detect exact duplicates, 
                visually similar images, and near-duplicate files using advanced algorithms.
              </p>
            </div>

            {/* Action Cards */}
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="directory" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Scan Directory
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Upload Media Files
                    </CardTitle>
                    <CardDescription>
                      Drag and drop your media files or click to browse. 
                      Supports images and videos up to 100MB each.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Choose files to upload</h3>
                      <p className="text-muted-foreground mb-4">
                        Drop files here or click to browse
                      </p>
                      <Button>
                        Select Files
                      </Button>
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Uploaded Files</h4>
                          <Badge variant="secondary">{uploadedFiles.length} files</Badge>
                        </div>
                        <Button 
                          onClick={() => handleStartScan('upload')}
                          className="w-full"
                          size="lg"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Scan for Duplicates
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="directory" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-primary" />
                      Scan Directory
                    </CardTitle>
                    <CardDescription>
                      Recursively scan a directory for all media files. 
                      Great for analyzing large photo libraries.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Directory Path</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={directoryPath}
                          onChange={(e) => setDirectoryPath(e.target.value)}
                          placeholder="e.g., /home/user/Pictures or C:\Users\User\Pictures"
                          className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                        />
                        <Button variant="outline">
                          Browse
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleStartScan('directory')}
                      className="w-full"
                      size="lg"
                      disabled={!directoryPath.trim()}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Start Directory Scan
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Exact Duplicates</h3>
                  <p className="text-sm text-muted-foreground">
                    Find identical files using MD5 and SHA-256 hashing
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Visual Similarity</h3>
                  <p className="text-sm text-muted-foreground">
                    Detect visually similar images using perceptual hashing
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced near-duplicate detection using machine learning
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Scan Progress View */}
        {currentView === 'scan' && scanProgress && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {scanProgress.stage === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {scanProgress.stage === 'complete' ? 'Scan Complete' : 'Scanning in Progress'}
                </CardTitle>
                <CardDescription>
                  {scanProgress.stage === 'scanning' && 'Discovering media files...'}
                  {scanProgress.stage === 'hashing' && 'Analyzing files and generating signatures...'}
                  {scanProgress.stage === 'comparing' && 'Comparing files for duplicates...'}
                  {scanProgress.stage === 'complete' && 'Analysis finished successfully!'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((scanProgress.processed / scanProgress.total) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(scanProgress.processed / scanProgress.total) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {scanProgress.processed.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Files Processed</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {scanProgress.duplicatesFound}
                    </div>
                    <div className="text-sm text-muted-foreground">Duplicates Found</div>
                  </div>
                </div>

                {scanProgress.current && scanProgress.stage !== 'complete' && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Currently processing:</p>
                    <p className="font-medium truncate">{scanProgress.current}</p>
                  </div>
                )}

                {scanProgress.stage === 'complete' && scanProgress.duplicatesFound > 0 && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-orange-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">
                          Found {scanProgress.duplicatesFound} groups of duplicate files
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => setCurrentView('results')} size="lg">
                      View Results
                    </Button>
                  </div>
                )}

                {scanProgress.stage === 'complete' && scanProgress.duplicatesFound === 0 && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          No duplicate files found. Your media library is clean!
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentView('upload')}
                    >
                      Start New Scan
                    </Button>
                  </div>
                )}

                {!isScanning && scanProgress.stage !== 'complete' && (
                  <div className="text-center">
                    <Button variant="destructive" size="sm">
                      Stop Scan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{mockStats.totalFiles.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Files</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{mockStats.duplicateGroups.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Duplicate Groups</p>
                    </div>
                    <Search className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{mockStats.totalDuplicateFiles.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Duplicate Files</p>
                    </div>
                    <Settings className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{formatBytes(mockStats.potentialSpaceSaved)}</p>
                      <p className="text-sm text-muted-foreground">Space to Save</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mock duplicate group display */}
            {duplicateGroups.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-red-500" />
                        Exact Duplicate
                      </CardTitle>
                      <CardDescription>2 identical files found</CardDescription>
                    </div>
                    <Badge variant="destructive">100% similar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {duplicateGroups[0].files.map((file, index) => (
                      <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <input type="checkbox" className="h-4 w-4" />
                        <FileImage className="w-8 h-8 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatBytes(file.size)}</span>
                            <span>{file.path}</span>
                          </div>
                        </div>
                        {index === 0 && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="destructive" size="sm">
                      Delete Duplicates
                    </Button>
                    <Button variant="outline" size="sm">
                      Mark as Verified
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Back to Upload */}
            <div className="text-center pt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView('upload');
                  setDuplicateGroups([]);
                  setAllFiles([]);
                  setScanProgress(null);
                }}
              >
                Start New Scan
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}