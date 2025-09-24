'use client';

import React from 'react';
import { ScanProgress as ScanProgressType } from '@/types/media';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ScanProgressProps {
  progress: ScanProgressType;
  onStop?: () => void;
  showDetails?: boolean;
}

export default function ScanProgress({ progress, onStop, showDetails = true }: ScanProgressProps) {
  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const getStageDescription = () => {
    switch (progress.stage) {
      case 'scanning':
        return 'Scanning for media files...';
      case 'hashing':
        return 'Analyzing files and generating hashes...';
      case 'comparing':
        return 'Comparing files for duplicates...';
      case 'generating-thumbnails':
        return 'Generating thumbnails...';
      case 'complete':
        return 'Scan complete!';
      default:
        return 'Processing...';
    }
  };

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const isComplete = progress.stage === 'complete';
  const percentage = getProgressPercentage();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStageIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {isComplete ? 'Scan Complete' : 'Scanning in Progress'}
          </h3>
        </div>
        
        {onStop && !isComplete && (
          <button
            onClick={onStop}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {getStageDescription()}
          </span>
          <span className="text-sm text-gray-500">
            {percentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Progress Details */}
      {showDetails && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Files processed:</span>
            <span className="font-medium">
              {progress.processed.toLocaleString()} / {progress.total.toLocaleString()}
            </span>
          </div>

          {progress.duplicatesFound > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duplicate groups found:</span>
              <span className="font-medium text-orange-600">
                {progress.duplicatesFound.toLocaleString()}
              </span>
            </div>
          )}

          {progress.current && !isComplete && (
            <div className="text-sm">
              <span className="text-gray-600">Currently processing:</span>
              <p className="font-medium text-gray-900 truncate mt-1">
                {progress.current}
              </p>
            </div>
          )}

          {isComplete && progress.duplicatesFound > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                <p className="text-sm text-orange-700">
                  Found {progress.duplicatesFound} groups of duplicate files. 
                  Review them below to free up storage space.
                </p>
              </div>
            </div>
          )}

          {isComplete && progress.duplicatesFound === 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">
                  No duplicate files found. Your media library is clean!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time Estimation */}
      {!isComplete && progress.processed > 0 && progress.total > progress.processed && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Estimated time remaining: {calculateTimeRemaining(progress)}
          </p>
        </div>
      )}
    </div>
  );
}

function calculateTimeRemaining(progress: ScanProgressType): string {
  if (progress.processed === 0) return 'Calculating...';
  
  const rate = progress.processed / 1; // Assuming 1 minute has passed (simplified)
  const remaining = progress.total - progress.processed;
  const timeRemaining = remaining / rate;
  
  if (timeRemaining < 1) return 'Less than 1 minute';
  if (timeRemaining < 60) return `${Math.round(timeRemaining)} minutes`;
  
  const hours = Math.floor(timeRemaining / 60);
  const minutes = Math.round(timeRemaining % 60);
  
  return `${hours}h ${minutes}m`;
}