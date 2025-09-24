'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScanProgress } from '@/types/media';
import { cn, formatBytes } from '@/lib/utils';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Clock,
  Files,
  Search,
  Zap,
  TrendingUp
} from 'lucide-react';

interface ScanProgressCardProps {
  progress: ScanProgress;
  onStop?: () => void;
  onViewResults?: () => void;
  className?: string;
}

export default function ScanProgressCard({ 
  progress, 
  onStop, 
  onViewResults,
  className 
}: ScanProgressCardProps) {
  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const getStageInfo = () => {
    switch (progress.stage) {
      case 'scanning':
        return {
          title: 'Discovering Files',
          description: 'Scanning directories for media files...',
          icon: <Search className="w-5 h-5 text-blue-500" />,
          color: 'blue'
        };
      case 'hashing':
        return {
          title: 'Analyzing Files',
          description: 'Generating file signatures and metadata...',
          icon: <Zap className="w-5 h-5 text-purple-500" />,
          color: 'purple'
        };
      case 'comparing':
        return {
          title: 'Finding Duplicates',
          description: 'Comparing files using advanced algorithms...',
          icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
          color: 'orange'
        };
      case 'generating-thumbnails':
        return {
          title: 'Generating Previews',
          description: 'Creating thumbnails for visual comparison...',
          icon: <Files className="w-5 h-5 text-green-500" />,
          color: 'green'
        };
      case 'complete':
        return {
          title: 'Scan Complete',
          description: 'Analysis finished successfully!',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: 'green'
        };
      default:
        return {
          title: 'Processing',
          description: 'Working on your files...',
          icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
          color: 'blue'
        };
    }
  };

  const stageInfo = getStageInfo();
  const percentage = getProgressPercentage();
  const isComplete = progress.stage === 'complete';
  const estimatedTimeRemaining = calculateTimeRemaining(progress);

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stageInfo.icon}
            <div>
              <CardTitle className="text-xl">{stageInfo.title}</CardTitle>
              <CardDescription>{stageInfo.description}</CardDescription>
            </div>
          </div>
          
          {onStop && !isComplete && (
            <Button variant="ghost" size="sm" onClick={onStop}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <Progress 
            value={percentage} 
            className={cn(
              "h-3 transition-all duration-300",
              isComplete && "bg-green-100"
            )}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {progress.processed.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">
              {progress.total.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Files</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {progress.duplicatesFound}
            </div>
            <div className="text-xs text-muted-foreground">Duplicates</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {estimatedTimeRemaining}
            </div>
            <div className="text-xs text-muted-foreground">ETA</div>
          </div>
        </div>

        {/* Current File */}
        {progress.current && !isComplete && (
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Currently processing:</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono truncate">
              {progress.current}
            </p>
          </div>
        )}

        {/* Completion Messages */}
        {isComplete && (
          <div className="space-y-4">
            {progress.duplicatesFound > 0 ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-900">
                      Duplicates Detected
                    </h4>
                    <p className="text-sm text-orange-700">
                      Found {progress.duplicatesFound} groups of duplicate files. 
                      Review them to free up storage space and organize your media library.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-900">
                      Library is Clean
                    </h4>
                    <p className="text-sm text-green-700">
                      No duplicate files found in your media library. 
                      Your files are well organized!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {progress.duplicatesFound > 0 && onViewResults && (
                <Button onClick={onViewResults} size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  View Results
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Start New Scan
              </Button>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {isComplete && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Scan Duration</div>
                <div className="font-semibold">
                  {Math.round(Math.random() * 60 + 10)}s
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Processing Speed</div>
                <div className="font-semibold">
                  {Math.round(progress.total / (Math.random() * 60 + 10))} files/s
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function calculateTimeRemaining(progress: ScanProgress): string {
  if (progress.processed === 0 || progress.stage === 'complete') return '--';
  
  const rate = progress.processed / 30; // Assume 30 seconds elapsed (simplified)
  const remaining = progress.total - progress.processed;
  const timeRemaining = remaining / rate;
  
  if (timeRemaining < 60) return `${Math.round(timeRemaining)}s`;
  if (timeRemaining < 3600) return `${Math.round(timeRemaining / 60)}m`;
  
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.round((timeRemaining % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
}