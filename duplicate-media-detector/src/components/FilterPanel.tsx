'use client';

import React, { useState } from 'react';
import { FilterOptions } from '@/types/media';
import { 
  Filter, 
  X, 
  Calendar, 
  HardDrive, 
  Image, 
  Video, 
  Tag,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalFiles: number;
  filteredFiles: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  totalFiles,
  filteredFiles,
  isOpen,
  onToggle
}: FilterPanelProps) {
  const [dateRange, setDateRange] = useState({
    start: filters.dateRange.start?.toISOString().split('T')[0] || '',
    end: filters.dateRange.end?.toISOString().split('T')[0] || ''
  });

  const [sizeRange, setSizeRange] = useState({
    min: filters.sizeRange.min ? Math.round(filters.sizeRange.min / (1024 * 1024)) : '',
    max: filters.sizeRange.max ? Math.round(filters.sizeRange.max / (1024 * 1024)) : ''
  });

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleFileTypeToggle = (fileType: string) => {
    const newFileTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter(type => type !== fileType)
      : [...filters.fileTypes, fileType];
    
    updateFilters({ fileTypes: newFileTypes });
  };

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    
    updateFilters({ sources: newSources });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    const dateRangeFilter = {
      start: newDateRange.start ? new Date(newDateRange.start) : undefined,
      end: newDateRange.end ? new Date(newDateRange.end) : undefined
    };
    
    updateFilters({ dateRange: dateRangeFilter });
  };

  const handleSizeRangeChange = (field: 'min' | 'max', value: string) => {
    const newSizeRange = { ...sizeRange, [field]: value };
    setSizeRange(newSizeRange);
    
    const sizeRangeFilter = {
      min: newSizeRange.min ? parseInt(newSizeRange.min) * 1024 * 1024 : undefined,
      max: newSizeRange.max ? parseInt(newSizeRange.max) * 1024 * 1024 : undefined
    };
    
    updateFilters({ sizeRange: sizeRangeFilter });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      fileTypes: [],
      dateRange: {},
      sizeRange: {},
      sources: [],
      tags: [],
      duplicateType: 'all'
    };
    
    onFiltersChange(clearedFilters);
    setDateRange({ start: '', end: '' });
    setSizeRange({ min: '', max: '' });
  };

  const hasActiveFilters = () => {
    return (
      filters.fileTypes.length > 0 ||
      filters.sources.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end ||
      filters.sizeRange.min ||
      filters.sizeRange.max ||
      filters.duplicateType !== 'all' ||
      filters.verified !== undefined
    );
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggle}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Show Filters</span>
            </button>
            
            {hasActiveFilters() && (
              <span className="text-sm text-gray-600">
                Showing {filteredFiles.toLocaleString()} of {totalFiles.toLocaleString()} files
              </span>
            )}
          </div>
          
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {filteredFiles.toLocaleString()} of {totalFiles.toLocaleString()} files
          </span>
          
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Clear all
            </button>
          )}
          
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* File Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Image className="w-4 h-4 mr-2" />
            File Types
          </h4>
          <div className="space-y-2">
            {['image', 'video'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.fileTypes.includes(type)}
                  onChange={() => handleFileTypeToggle(type)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize flex items-center">
                  {type === 'image' && <Image className="w-4 h-4 mr-1" />}
                  {type === 'video' && <Video className="w-4 h-4 mr-1" />}
                  {type}s
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Duplicate Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Duplicate Type
          </h4>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Types' },
              { value: 'exact', label: 'Exact Duplicates' },
              { value: 'perceptual', label: 'Visually Similar' },
              { value: 'near-duplicate', label: 'Near Duplicates' }
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="duplicateType"
                  value={option.value}
                  checked={filters.duplicateType === option.value}
                  onChange={(e) => updateFilters({ duplicateType: e.target.value as any })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            Sources
          </h4>
          <div className="space-y-2">
            {['local', 'google-drive', 'dropbox', 'aws-s3'].map(source => (
              <label key={source} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {source.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </h4>
          <div className="space-y-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Start date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="End date"
            />
          </div>
        </div>

        {/* File Size */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            File Size (MB)
          </h4>
          <div className="space-y-2">
            <input
              type="number"
              value={sizeRange.min}
              onChange={(e) => handleSizeRangeChange('min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Min size"
              min="0"
            />
            <input
              type="number"
              value={sizeRange.max}
              onChange={(e) => handleSizeRangeChange('max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Max size"
              min="0"
            />
          </div>
        </div>

        {/* Verification Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Verification
          </h4>
          <div className="space-y-2">
            {[
              { value: undefined, label: 'All Groups' },
              { value: true, label: 'Verified Only' },
              { value: false, label: 'Unverified Only' }
            ].map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name="verified"
                  checked={filters.verified === option.value}
                  onChange={() => updateFilters({ verified: option.value })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.fileTypes.map(type => (
              <span
                key={type}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {type}
                <button
                  onClick={() => handleFileTypeToggle(type)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.sources.map(source => (
              <span
                key={source}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {source.replace('-', ' ')}
                <button
                  onClick={() => handleSourceToggle(source)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}