'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (filePaths: string[]) => void;
  isUploading: boolean;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  path?: string;
}

export default function FileUpload({ onFilesUploaded, isUploading }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const
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
        filesToUpload.some(upload => upload.file === f.file)
          ? { ...f, status: 'uploading' }
          : f
      )
    );

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update successful uploads
        setUploadedFiles(prev => 
          prev.map(f => {
            const uploadIndex = filesToUpload.findIndex(upload => upload.file === f.file);
            if (uploadIndex !== -1) {
              return {
                ...f,
                status: 'success',
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
                  ? { ...f, status: 'error', error }
                  : f
              )
            );
          });
        }
      } else {
        // Mark all as failed
        setUploadedFiles(prev => 
          prev.map(f => 
            filesToUpload.some(upload => upload.file === f.file)
              ? { ...f, status: 'error', error: result.error }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => 
        prev.map(f => 
          filesToUpload.some(upload => upload.file === f.file)
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const removeFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp']
    },
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop media files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: Images (JPG, PNG, GIF, etc.) and Videos (MP4, AVI, MOV, etc.)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Uploaded Files</h3>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'pending' && (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" title={uploadedFile.error} />
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadedFile)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploadedFile.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}