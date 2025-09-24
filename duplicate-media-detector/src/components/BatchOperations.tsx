'use client';

import React, { useState } from 'react';
import { DuplicateGroup, MediaFile } from '@/types/media';
import { 
  Trash2, 
  Tag, 
  Download, 
  CheckSquare, 
  Square, 
  Star,
  AlertTriangle,
  HardDrive,
  FileText
} from 'lucide-react';

interface BatchOperationsProps {
  duplicateGroups: DuplicateGroup[];
  onBatchDelete: (filePaths: string[]) => void;
  onBatchTag: (fileIds: string[], tags: string[]) => void;
  onExportReport: (format: 'json' | 'csv' | 'pdf') => void;
  onBulkVerify: (groupIds: string[]) => void;
  onBulkSetPrimary: (operations: { groupId: string; fileId: string }[]) => void;
}

export default function BatchOperations({
  duplicateGroups,
  onBatchDelete,
  onBatchTag,
  onExportReport,
  onBulkVerify,
  onBulkSetPrimary
}: BatchOperationsProps) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showOperations, setShowOperations] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [operationMode, setOperationMode] = useState<'groups' | 'files'>('groups');

  const toggleGroupSelection = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
      // Also remove all files from this group
      const group = duplicateGroups.find(g => g.id === groupId);
      if (group) {
        const newSelectedFiles = new Set(selectedFiles);
        group.files.forEach(file => newSelectedFiles.delete(file.id));
        setSelectedFiles(newSelectedFiles);
      }
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const toggleFileSelection = (fileId: string, groupId: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileId)) {
      newSelectedFiles.delete(fileId);
    } else {
      newSelectedFiles.add(fileId);
    }
    setSelectedFiles(newSelectedFiles);

    // Update group selection based on file selection
    const group = duplicateGroups.find(g => g.id === groupId);
    if (group) {
      const groupFileIds = group.files.map(f => f.id);
      const selectedInGroup = groupFileIds.filter(id => newSelectedFiles.has(id));
      
      const newSelectedGroups = new Set(selectedGroups);
      if (selectedInGroup.length === groupFileIds.length) {
        newSelectedGroups.add(groupId);
      } else {
        newSelectedGroups.delete(groupId);
      }
      setSelectedGroups(newSelectedGroups);
    }
  };

  const selectAllNonPrimary = () => {
    const newSelectedFiles = new Set<string>();
    const newSelectedGroups = new Set<string>();
    
    duplicateGroups.forEach(group => {
      group.files.forEach(file => {
        if (file.id !== group.primaryFile?.id) {
          newSelectedFiles.add(file.id);
        }
      });
      newSelectedGroups.add(group.id);
    });
    
    setSelectedFiles(newSelectedFiles);
    setSelectedGroups(newSelectedGroups);
  };

  const selectAllUnverified = () => {
    const newSelectedGroups = new Set<string>();
    
    duplicateGroups.forEach(group => {
      if (!group.verified) {
        newSelectedGroups.add(group.id);
      }
    });
    
    setSelectedGroups(newSelectedGroups);
  };

  const clearSelection = () => {
    setSelectedGroups(new Set());
    setSelectedFiles(new Set());
  };

  const handleBatchDelete = () => {
    const filesToDelete: string[] = [];
    
    if (operationMode === 'groups') {
      // Delete all non-primary files from selected groups
      duplicateGroups
        .filter(group => selectedGroups.has(group.id))
        .forEach(group => {
          group.files.forEach(file => {
            if (file.id !== group.primaryFile?.id) {
              filesToDelete.push(file.path);
            }
          });
        });
    } else {
      // Delete specifically selected files
      duplicateGroups.forEach(group => {
        group.files.forEach(file => {
          if (selectedFiles.has(file.id)) {
            filesToDelete.push(file.path);
          }
        });
      });
    }

    if (filesToDelete.length > 0) {
      if (confirm(`Are you sure you want to delete ${filesToDelete.length} files?`)) {
        onBatchDelete(filesToDelete);
        clearSelection();
      }
    }
  };

  const handleBatchTag = () => {
    if (!tagInput.trim()) return;

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    const fileIds: string[] = [];

    if (operationMode === 'groups') {
      duplicateGroups
        .filter(group => selectedGroups.has(group.id))
        .forEach(group => {
          group.files.forEach(file => {
            fileIds.push(file.id);
          });
        });
    } else {
      fileIds.push(...Array.from(selectedFiles));
    }

    if (fileIds.length > 0) {
      onBatchTag(fileIds, tags);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleBulkVerify = () => {
    const groupIds = Array.from(selectedGroups);
    if (groupIds.length > 0) {
      onBulkVerify(groupIds);
    }
  };

  const handleSetLargestAsPrimary = () => {
    const operations: { groupId: string; fileId: string }[] = [];
    
    duplicateGroups
      .filter(group => selectedGroups.has(group.id))
      .forEach(group => {
        // Find the largest file in the group
        const largestFile = group.files.reduce((largest, current) => 
          current.size > largest.size ? current : largest
        );
        
        if (largestFile.id !== group.primaryFile?.id) {
          operations.push({
            groupId: group.id,
            fileId: largestFile.id
          });
        }
      });

    if (operations.length > 0) {
      onBulkSetPrimary(operations);
    }
  };

  const calculateStats = () => {
    let totalFiles = 0;
    let totalSize = 0;
    let potentialSavings = 0;

    if (operationMode === 'groups') {
      duplicateGroups
        .filter(group => selectedGroups.has(group.id))
        .forEach(group => {
          totalFiles += group.files.length;
          const groupSize = group.files.reduce((sum, file) => sum + file.size, 0);
          totalSize += groupSize;
          potentialSavings += groupSize - (group.primaryFile?.size || 0);
        });
    } else {
      duplicateGroups.forEach(group => {
        group.files.forEach(file => {
          if (selectedFiles.has(file.id)) {
            totalFiles++;
            totalSize += file.size;
            if (file.id !== group.primaryFile?.id) {
              potentialSavings += file.size;
            }
          }
        });
      });
    }

    return { totalFiles, totalSize, potentialSavings };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = calculateStats();
  const hasSelection = selectedGroups.size > 0 || selectedFiles.size > 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Batch Operations
          </h3>
          
          <button
            onClick={() => setShowOperations(!showOperations)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showOperations ? 'Hide' : 'Show'} Operations
          </button>
        </div>

        {/* Quick Stats */}
        {hasSelection && (
          <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
            <span>
              {operationMode === 'groups' ? selectedGroups.size : selectedFiles.size} selected
            </span>
            <span>{stats.totalFiles} files</span>
            <span>{formatFileSize(stats.totalSize)} total</span>
            <span className="text-green-600">
              {formatFileSize(stats.potentialSavings)} can be saved
            </span>
          </div>
        )}
      </div>

      {showOperations && (
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Operation mode:</span>
            <label className="flex items-center">
              <input
                type="radio"
                name="operationMode"
                value="groups"
                checked={operationMode === 'groups'}
                onChange={(e) => setOperationMode(e.target.value as 'groups' | 'files')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Select by groups</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="operationMode"
                value="files"
                checked={operationMode === 'files'}
                onChange={(e) => setOperationMode(e.target.value as 'groups' | 'files')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Select individual files</span>
            </label>
          </div>

          {/* Quick Selection */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={selectAllNonPrimary}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md text-sm"
            >
              <Star className="w-4 h-4" />
              <span>Select all non-primary files</span>
            </button>
            
            <button
              onClick={selectAllUnverified}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-md text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Select unverified groups</span>
            </button>
            
            <button
              onClick={clearSelection}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
            >
              <Square className="w-4 h-4" />
              <span>Clear selection</span>
            </button>
          </div>

          {/* Operations */}
          {hasSelection && (
            <div className="space-y-4">
              {/* Delete Operations */}
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Delete Selected Files
                    </p>
                    <p className="text-xs text-red-700">
                      This will permanently delete {stats.totalFiles} files 
                      and free up {formatFileSize(stats.potentialSavings)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  Delete Files
                </button>
              </div>

              {/* Tag Operations */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Tag Selected Files
                      </p>
                      <p className="text-xs text-blue-700">
                        Add tags to {stats.totalFiles} files
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTagInput(!showTagInput)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Add Tags
                  </button>
                </div>
                
                {showTagInput && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tags separated by commas"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleBatchTag()}
                    />
                    <button
                      onClick={handleBatchTag}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setShowTagInput(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Group Operations */}
              {operationMode === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckSquare className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Verify Groups
                          </p>
                          <p className="text-xs text-green-700">
                            Mark {selectedGroups.size} groups as verified
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleBulkVerify}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-900">
                            Set Largest as Primary
                          </p>
                          <p className="text-xs text-purple-700">
                            Auto-select largest files as primary
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSetLargestAsPrimary}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Operations */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Export Report
                  </p>
                  <p className="text-xs text-gray-600">
                    Generate detailed report of duplicate analysis
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onExportReport('json')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  JSON
                </button>
                <button
                  onClick={() => onExportReport('csv')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  CSV
                </button>
                <button
                  onClick={() => onExportReport('pdf')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Interface for Groups/Files */}
      {showOperations && (
        <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
          {duplicateGroups.map(group => (
            <div key={group.id} className="p-4 border-b border-gray-100 last:border-b-0">
              {operationMode === 'groups' ? (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(group.id)}
                    onChange={() => toggleGroupSelection(group.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {group.type} - {group.similarity}% similar
                      </span>
                      {!group.verified && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {group.files.length} files
                    </p>
                  </div>
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">
                    {group.type} - {group.similarity}% similar
                  </div>
                  {group.files.map(file => (
                    <label key={file.id} className="flex items-center space-x-3 cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id, group.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 truncate">
                            {file.name}
                          </span>
                          {file.id === group.primaryFile?.id && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.dimensions && (
                            <span>{file.dimensions.width} × {file.dimensions.height}</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}