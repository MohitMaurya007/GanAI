'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatBytes } from '@/lib/utils';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  Video,
  Loader2
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  path?: string;
}

interface FileUploadZoneProps {
  onFilesUploaded: (filePaths: string[]) => void;
  isUploading: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  className?: string;
}

export default function FileUploadZone({
  onFilesUploaded,
  isUploading,
  maxFiles = 50,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  className
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        console.warn(`File ${file.name} rejected:`, errors);
      });
    }

    // Process accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    uploadFiles(newFiles);
  }, []);

  const uploadFiles = async (filesToUpload: UploadedFile[]) => {
    const formData = new FormData();
    filesToUpload.forEach(({ file }) => {
      formData.append('files', file);
    });

    // Update status to uploading
    setUploadedFiles(prev => 
      prev.map(f => 
        filesToUpload.some(upload => upload.id === f.id)
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => {
            if (filesToUpload.some(upload => upload.id === f.id) && f.status === 'uploading') {
              const newProgress = Math.min(f.progress + Math.random() * 20, 90);
              return { ...f, progress: newProgress };
            }
            return f;
          })
        );
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      const result = await response.json();

      if (result.success) {
        // Update successful uploads
        setUploadedFiles(prev => 
          prev.map((f, index) => {
            const uploadIndex = filesToUpload.findIndex(upload => upload.id === f.id);
            if (uploadIndex !== -1) {
              return {
                ...f,
                status: 'success',
                progress: 100,
                path: result.uploadedFiles[uploadIndex]
              };
            }
            return f;
          })
        );

        // Notify parent component
        onFilesUploaded(result.uploadedFiles);

        // Handle errors if any
        if (result.errors) {
          result.errors.forEach((error: string) => {
            const [filename] = error.split(':');
            setUploadedFiles(prev => 
              prev.map(f => 
                f.file.name === filename
                  ? { ...f, status: 'error', error, progress: 0 }
                  : f
              )
            );
          });
        }
      } else {
        // Mark all as failed
        setUploadedFiles(prev => 
          prev.map(f => 
            filesToUpload.some(upload => upload.id === f.id)
              ? { ...f, status: 'error', error: result.error, progress: 0 }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => 
        prev.map(f => 
          filesToUpload.some(upload => upload.id === f.id)
            ? { ...f, status: 'error', error: 'Upload failed', progress: 0 }
            : f
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (file.type.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp']
    },
    disabled: isUploading,
    maxFiles,
    maxSize: maxFileSize,
    multiple: true
  });

  const successfulUploads = uploadedFiles.filter(f => f.status === 'success').length;
  const failedUploads = uploadedFiles.filter(f => f.status === 'error').length;
  const uploadingFiles = uploadedFiles.filter(f => f.status === 'uploading').length;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Drop Zone */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragActive && "border-primary bg-primary/10 scale-[1.02]",
              isDragReject && "border-destructive bg-destructive/10",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>

            {isDragActive ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Drop files here</h3>
                <p className="text-muted-foreground">Release to upload your media files</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload Media Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag & drop files here, or click to browse
                  </p>
                </div>
                
                <Button type="button" disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>Max {maxFiles} files</span>
                  <span>•</span>
                  <span>Up to {formatBytes(maxFileSize)} each</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Status Summary */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Upload Status</h4>
              <div className="flex items-center gap-2">
                {successfulUploads > 0 && (
                  <Badge variant="success">{successfulUploads} uploaded</Badge>
                )}
                {uploadingFiles > 0 && (
                  <Badge variant="info">{uploadingFiles} uploading</Badge>
                )}
                {failedUploads > 0 && (
                  <Badge variant="destructive">{failedUploads} failed</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  {getFileIcon(uploadedFile.file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      {uploadedFile.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      {uploadedFile.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      {uploadedFile.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatBytes(uploadedFile.file.size)}</span>
                      {uploadedFile.status === 'error' && uploadedFile.error && (
                        <span className="text-red-500">{uploadedFile.error}</span>
                      )}
                    </div>

                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    disabled={uploadedFile.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}