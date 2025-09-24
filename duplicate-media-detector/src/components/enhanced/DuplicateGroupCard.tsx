'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DuplicateGroup, MediaFile } from '@/types/media';
import { cn, formatBytes, formatDate, calculateSimilarityColor } from '@/lib/utils';
import { 
  Star, 
  Trash2, 
  Tag, 
  Calendar, 
  HardDrive, 
  Image as ImageIcon, 
  Video, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  MoreHorizontal,
  FolderOpen,
  Copy,
  Download
} from 'lucide-react';

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDeleteFiles: (filePaths: string[]) => void;
  onSetPrimary: (groupId: string, fileId: string) => void;
  onVerifyGroup: (groupId: string) => void;
  onTagFiles: (fileIds: string[], tags: string[]) => void;
  className?: string;
}

export default function DuplicateGroupCard({
  group,
  onDeleteFiles,
  onSetPrimary,
  onVerifyGroup,
  onTagFiles,
  className
}: DuplicateGroupCardProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
      if (confirm(`Are you sure you want to delete ${filesToDelete.length} files?`)) {
        onDeleteFiles(filesToDelete);
        setSelectedFiles(new Set());
      }
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
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (file.type === 'video') {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    return <HardDrive className="w-5 h-5 text-gray-500" />;
  };

  const getTypeLabel = () => {
    switch (group.type) {
      case 'exact': return { label: 'Exact Duplicate', icon: CheckCircle, color: 'text-red-500' };
      case 'perceptual': return { label: 'Visually Similar', icon: AlertTriangle, color: 'text-orange-500' };
      case 'near-duplicate': return { label: 'Near Duplicate', icon: AlertTriangle, color: 'text-yellow-500' };
      default: return { label: 'Duplicate', icon: AlertTriangle, color: 'text-gray-500' };
    }
  };

  const typeInfo = getTypeLabel();
  const TypeIcon = typeInfo.icon;
  const hasSelection = selectedFiles.size > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", typeInfo.color)}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
              <CardDescription>
                {group.files.length} files • {group.similarity}% similar
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={group.similarity >= 95 ? "destructive" : 
                      group.similarity >= 85 ? "warning" : "secondary"}
              className="text-xs"
            >
              {group.similarity}%
            </Badge>
            
            {!group.verified && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVerifyGroup(group.id)}
                className="text-xs"
              >
                Verify
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        {hasSelection && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary">
                  {selectedFiles.size} files selected
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(calculateSpaceSaved())} to save
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {showTagInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter tags (comma-separated)"
                      className="px-2 py-1 text-xs border rounded"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTags()}
                    />
                    <Button size="sm" onClick={handleAddTags}>
                      Add
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTagInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTagInput(true)}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllExceptPrimary}
            className="h-7 px-2"
          >
            Select non-primary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFiles(new Set())}
            className="h-7 px-2"
          >
            Clear selection
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {group.files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                file.id === group.primaryFile?.id && "bg-green-50 border-green-200",
                selectedFiles.has(file.id) && "bg-primary/5 border-primary/30"
              )}
            >
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />

              {/* File Icon */}
              <div className="flex-shrink-0">
                {getTypeIcon(file)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  {file.id === group.primaryFile?.id && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                  {group.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatBytes(file.size)}
                  </span>
                  
                  {file.dimensions && (
                    <span>
                      {file.dimensions.width} × {file.dimensions.height}
                    </span>
                  )}
                  
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(file.modifiedAt)}
                  </span>
                </div>

                {showDetails && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FolderOpen className="w-3 h-3" />
                      <span className="truncate font-mono">{file.path}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {file.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        {file.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File Actions */}
              <div className="flex items-center gap-1">
                {file.id !== group.primaryFile?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetPrimary(group.id, file.id)}
                    className="h-8 w-8 p-0"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Group Stats */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">
                  {formatBytes(group.files.reduce((sum, file) => sum + file.size, 0))}
                </div>
                <div className="text-xs text-muted-foreground">Total Size</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatBytes(
                    group.files.reduce((sum, file) => sum + file.size, 0) - 
                    (group.primaryFile?.size || 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Can Save</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {formatDate(group.createdAt)}
                </div>
                <div className="text-xs text-muted-foreground">Detected</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {group.type.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">Match Type</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}