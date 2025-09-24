'use client';

import React, { useState } from 'react';
import { DuplicateGroup as DuplicateGroupType, MediaFile } from '@/types/media';
import { 
  Star, 
  Trash2, 
  Tag, 
  Calendar, 
  HardDrive, 
  Image, 
  Video, 
  CheckCircle,
  AlertTriangle,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface DuplicateGroupProps {
  group: DuplicateGroupType;
  onDeleteFiles: (filePaths: string[]) => void;
  onSetPrimary: (groupId: string, fileId: string) => void;
  onVerifyGroup: (groupId: string) => void;
  onTagFiles: (fileIds: string[], tags: string[]) => void;
}

export default function DuplicateGroup({
  group,
  onDeleteFiles,
  onSetPrimary,
  onVerifyGroup,
  onTagFiles
}: DuplicateGroupProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllExceptPrimary = () => {
    const newSelected = new Set<string>();
    group.files.forEach(file => {
      if (file.id !== group.primaryFile?.id) {
        newSelected.add(file.id);
      }
    });
    setSelectedFiles(newSelected);
  };

  const handleDeleteSelected = () => {
    const filesToDelete = group.files
      .filter(file => selectedFiles.has(file.id))
      .map(file => file.path);
    
    if (filesToDelete.length > 0) {
      onDeleteFiles(filesToDelete);
      setSelectedFiles(new Set());
    }
  };

  const handleAddTags = () => {
    if (tagInput.trim()) {
      const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const fileIds = Array.from(selectedFiles);
      onTagFiles(fileIds, tags);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const calculateSpaceSaved = () => {
    if (selectedFiles.size === 0) return 0;
    return group.files
      .filter(file => selectedFiles.has(file.id))
      .reduce((total, file) => total + file.size, 0);
  };

  const getTypeIcon = (file: MediaFile) => {
    if (file.type === 'image') {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    if (file.type === 'video') {
      return <Video className="w-4 h-4 text-purple-500" />;
    }
    return <HardDrive className="w-4 h-4 text-gray-500" />;
  };

  const getSimilarityColor = () => {
    if (group.similarity >= 95) return 'text-red-600 bg-red-50';
    if (group.similarity >= 85) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getTypeLabel = () => {
    switch (group.type) {
      case 'exact': return 'Exact Duplicate';
      case 'perceptual': return 'Visually Similar';
      case 'near-duplicate': return 'Near Duplicate';
      default: return 'Duplicate';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {group.type === 'exact' && <CheckCircle className="w-5 h-5 text-red-500" />}
              {group.type !== 'exact' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
              <h3 className="text-lg font-semibold text-gray-900">
                {getTypeLabel()}
              </h3>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor()}`}>
              {group.similarity}% similar
            </div>

            {!group.verified && (
              <button
                onClick={() => onVerifyGroup(group.id)}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Mark as verified
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {group.files.length} files
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {selectedFiles.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedFiles.size} files selected
              </span>
              <span className="text-sm text-blue-700">
                Space to save: {formatFileSize(calculateSpaceSaved())}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTagInput(true)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
              >
                <Tag className="w-4 h-4 inline mr-1" />
                Tag
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Tag Input */}
        {showTagInput && (
          <div className="mt-3 flex items-center space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTags()}
            />
            <button
              onClick={handleAddTags}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="mt-3 flex items-center space-x-4">
          <button
            onClick={selectAllExceptPrimary}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Select all except primary
          </button>
          <button
            onClick={() => setSelectedFiles(new Set())}
            className="text-sm text-gray-600 hover:text-gray-700 underline"
          >
            Clear selection
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="divide-y divide-gray-200">
        {group.files.map((file) => (
          <div
            key={file.id}
            className={`px-6 py-4 hover:bg-gray-50 ${
              file.id === group.primaryFile?.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />

              {/* File Icon */}
              <div className="flex-shrink-0">
                {getTypeIcon(file)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  {file.id === group.primaryFile?.id && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" title="Primary file" />
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center">
                    <HardDrive className="w-3 h-3 mr-1" />
                    {formatFileSize(file.size)}
                  </span>
                  
                  {file.dimensions && (
                    <span>
                      {file.dimensions.width} × {file.dimensions.height}
                    </span>
                  )}
                  
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(file.modifiedAt)}
                  </span>
                </div>

                {showDetails && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="truncate">{file.path}</p>
                    {file.tags.length > 0 && (
                      <div className="mt-1">
                        Tags: {file.tags.map(tag => (
                          <span key={tag} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {file.id !== group.primaryFile?.id && (
                  <button
                    onClick={() => onSetPrimary(group.id, file.id)}
                    className="p-1 text-gray-400 hover:text-yellow-500"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}