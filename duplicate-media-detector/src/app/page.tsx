'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  MediaFile, 
  DuplicateGroup, 
  ScanProgress as ScanProgressType, 
  FilterOptions 
} from '@/types/media';
import FileUpload from '@/components/FileUpload';
import ScanProgress from '@/components/ScanProgress';
import DuplicateGroupComponent from '@/components/DuplicateGroup';
import FilterPanel from '@/components/FilterPanel';
import BatchOperations from '@/components/BatchOperations';
import { 
  Search, 
  Settings, 
  Download, 
  BarChart3,
  FolderOpen,
  Upload,
  Zap
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
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    fileTypes: [],
    dateRange: {},
    sizeRange: {},
    sources: [],
    tags: [],
    duplicateType: 'all'
  });

  // Filtered data
  const [filteredGroups, setFilteredGroups] = useState<DuplicateGroup[]>([]);

  // Initialize session ID
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...duplicateGroups];

    // Filter by duplicate type
    if (filters.duplicateType !== 'all') {
      filtered = filtered.filter(group => group.type === filters.duplicateType);
    }

    // Filter by verification status
    if (filters.verified !== undefined) {
      filtered = filtered.filter(group => group.verified === filters.verified);
    }

    // Filter by file types
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(group =>
        group.files.some(file => filters.fileTypes.includes(file.type))
      );
    }

    // Filter by sources
    if (filters.sources.length > 0) {
      filtered = filtered.filter(group =>
        group.files.some(file => filters.sources.includes(file.source))
      );
    }

    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(group =>
        group.files.some(file => {
          const fileDate = new Date(file.modifiedAt);
          const start = filters.dateRange.start;
          const end = filters.dateRange.end;
          
          return (!start || fileDate >= start) && (!end || fileDate <= end);
        })
      );
    }

    // Filter by size range
    if (filters.sizeRange.min || filters.sizeRange.max) {
      filtered = filtered.filter(group =>
        group.files.some(file => {
          const min = filters.sizeRange.min || 0;
          const max = filters.sizeRange.max || Infinity;
          return file.size >= min && file.size <= max;
        })
      );
    }

    setFilteredGroups(filtered);
  }, [duplicateGroups, filters]);

  // Poll for scan progress
  useEffect(() => {
    if (!isScanning || !sessionId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', sessionId })
        });

        const result = await response.json();
        
        if (result.progress) {
          setScanProgress(result.progress);
          
          if (result.isComplete) {
            setIsScanning(false);
            if (result.hasResults) {
              fetchResults();
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    const interval = setInterval(pollProgress, 1000);
    return () => clearInterval(interval);
  }, [isScanning, sessionId]);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'results', sessionId })
      });

      const result = await response.json();
      
      if (result.success) {
        setAllFiles(result.files);
        setDuplicateGroups(result.duplicates);
        setCurrentView('results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleFilesUploaded = (filePaths: string[]) => {
    setUploadedFiles(prev => [...prev, ...filePaths]);
  };

  const handleStartScan = async (scanType: 'upload' | 'directory') => {
    if (!sessionId) return;

    const scanParams: any = {
      action: 'start',
      sessionId,
      similarityThreshold: 90
    };

    if (scanType === 'upload') {
      if (uploadedFiles.length === 0) {
        alert('Please upload files first');
        return;
      }
      scanParams.filePaths = uploadedFiles;
    } else {
      if (!directoryPath.trim()) {
        alert('Please enter a directory path');
        return;
      }
      scanParams.directoryPath = directoryPath;
    }

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanParams)
      });

      const result = await response.json();
      
      if (result.success) {
        setIsScanning(true);
        setCurrentView('scan');
      } else {
        alert('Failed to start scan: ' + result.error);
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('Failed to start scan');
    }
  };

  const handleStopScan = async () => {
    if (!sessionId) return;

    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', sessionId })
      });
      
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const handleDeleteFiles = async (filePaths: string[]) => {
    if (!confirm(`Are you sure you want to delete ${filePaths.length} files?`)) {
      return;
    }

    try {
      const response = await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', filePaths })
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove deleted files from groups
        const updatedGroups = duplicateGroups.map(group => ({
          ...group,
          files: group.files.filter(file => !filePaths.includes(file.path))
        })).filter(group => group.files.length > 1);
        
        setDuplicateGroups(updatedGroups);
        alert(`Successfully deleted ${result.deleted} files`);
      } else {
        alert('Error deleting files: ' + (result.errors?.join(', ') || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Failed to delete files');
    }
  };

  const handleSetPrimary = async (groupId: string, fileId: string) => {
    try {
      await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-primary', groupId, fileIds: [fileId] })
      });

      // Update local state
      const updatedGroups = duplicateGroups.map(group =>
        group.id === groupId
          ? { ...group, primaryFile: group.files.find(f => f.id === fileId) }
          : group
      );
      
      setDuplicateGroups(updatedGroups);
    } catch (error) {
      console.error('Error setting primary file:', error);
    }
  };

  const handleVerifyGroup = async (groupId: string) => {
    try {
      await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-group', groupId })
      });

      // Update local state
      const updatedGroups = duplicateGroups.map(group =>
        group.id === groupId ? { ...group, verified: true } : group
      );
      
      setDuplicateGroups(updatedGroups);
    } catch (error) {
      console.error('Error verifying group:', error);
    }
  };

  const handleTagFiles = async (fileIds: string[], tags: string[]) => {
    try {
      await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tag', fileIds, tags })
      });

      // Update local state (simplified)
      alert(`Tagged ${fileIds.length} files with ${tags.length} tags`);
    } catch (error) {
      console.error('Error tagging files:', error);
    }
  };

  const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          duplicateGroups: filteredGroups,
          allFiles,
          filters,
          includeStats: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `duplicate-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const handleBulkVerify = async (groupIds: string[]) => {
    try {
      const promises = groupIds.map(groupId =>
        fetch('/api/duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify-group', groupId })
        })
      );

      await Promise.all(promises);

      // Update local state
      const updatedGroups = duplicateGroups.map(group =>
        groupIds.includes(group.id) ? { ...group, verified: true } : group
      );
      
      setDuplicateGroups(updatedGroups);
      alert(`Verified ${groupIds.length} groups`);
    } catch (error) {
      console.error('Error bulk verifying groups:', error);
      alert('Failed to verify groups');
    }
  };

  const handleBulkSetPrimary = async (operations: { groupId: string; fileId: string }[]) => {
    try {
      const promises = operations.map(op =>
        fetch('/api/duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set-primary', groupId: op.groupId, fileIds: [op.fileId] })
        })
      );

      await Promise.all(promises);

      // Update local state
      const updatedGroups = duplicateGroups.map(group => {
        const operation = operations.find(op => op.groupId === group.id);
        if (operation) {
          return {
            ...group,
            primaryFile: group.files.find(f => f.id === operation.fileId)
          };
        }
        return group;
      });
      
      setDuplicateGroups(updatedGroups);
      alert(`Updated primary files for ${operations.length} groups`);
    } catch (error) {
      console.error('Error bulk setting primary files:', error);
      alert('Failed to set primary files');
    }
  };

  const calculateStats = () => {
    const totalDuplicateFiles = duplicateGroups.reduce(
      (sum, group) => sum + group.files.length, 0
    );
    
    const potentialSpaceSaved = duplicateGroups.reduce((total, group) => {
      if (group.files.length <= 1) return total;
      const primarySize = group.primaryFile?.size || 0;
      const totalSize = group.files.reduce((sum, file) => sum + file.size, 0);
      return total + (totalSize - primarySize);
    }, 0);

    return { totalDuplicateFiles, potentialSpaceSaved };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Duplicate Media Detector
                </h1>
                <p className="text-sm text-gray-600">
                  Intelligent scanning and deduplication of media files
                </p>
              </div>
            </div>
            
            {currentView === 'results' && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {filteredGroups.length} duplicate groups
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    {formatFileSize(stats.potentialSpaceSaved)} can be saved
                  </p>
                </div>
                
                <button 
                  onClick={() => handleExportReport('json')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload View */}
        {currentView === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find and Remove Duplicate Media Files
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your media files or scan a directory to detect exact duplicates, 
                visually similar images, and near-duplicate files using advanced algorithms.
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <Upload className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Upload Files</h3>
              </div>
              
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                isUploading={false}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => handleStartScan('upload')}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Scan Uploaded Files ({uploadedFiles.length})
                  </button>
                </div>
              )}
            </div>

            {/* Directory Scan Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <FolderOpen className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Scan Directory</h3>
              </div>
              
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={directoryPath}
                  onChange={(e) => setDirectoryPath(e.target.value)}
                  placeholder="Enter directory path (e.g., /home/user/Pictures)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => handleStartScan('directory')}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Scan Directory
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                The scanner will recursively search for all supported media files in the specified directory.
              </p>
            </div>
          </div>
        )}

        {/* Scan Progress View */}
        {currentView === 'scan' && scanProgress && (
          <div className="space-y-6">
            <ScanProgress
              progress={scanProgress}
              onStop={handleStopScan}
              showDetails={true}
            />
            
            {scanProgress.stage === 'complete' && (
              <div className="text-center">
                <button
                  onClick={fetchResults}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Results
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {allFiles.length.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Files</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <Search className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {duplicateGroups.length.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Duplicate Groups</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <Settings className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalDuplicateFiles.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Duplicate Files</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <Download className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFileSize(stats.potentialSpaceSaved)}
                    </p>
                    <p className="text-sm text-gray-600">Space to Save</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              totalFiles={duplicateGroups.length}
              filteredFiles={filteredGroups.length}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />

            {/* Batch Operations */}
            {filteredGroups.length > 0 && (
              <BatchOperations
                duplicateGroups={filteredGroups}
                onBatchDelete={handleDeleteFiles}
                onBatchTag={handleTagFiles}
                onExportReport={handleExportReport}
                onBulkVerify={handleBulkVerify}
                onBulkSetPrimary={handleBulkSetPrimary}
              />
            )}

            {/* Duplicate Groups */}
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No duplicate groups found
                </h3>
                <p className="text-gray-600">
                  {duplicateGroups.length === 0 
                    ? "Your media library is clean! No duplicates detected."
                    : "Try adjusting your filters to see more results."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <DuplicateGroupComponent
                    key={group.id}
                    group={group}
                    onDeleteFiles={handleDeleteFiles}
                    onSetPrimary={handleSetPrimary}
                    onVerifyGroup={handleVerifyGroup}
                    onTagFiles={handleTagFiles}
                  />
                ))}
              </div>
            )}

            {/* Back to Upload */}
            <div className="text-center pt-8">
              <button
                onClick={() => {
                  setCurrentView('upload');
                  setDuplicateGroups([]);
                  setAllFiles([]);
                  setScanProgress(null);
                }}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Start New Scan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}