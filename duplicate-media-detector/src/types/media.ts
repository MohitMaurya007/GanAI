export interface MediaFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  mimeType: string;
  hash: string;
  perceptualHash?: string;
  createdAt: Date;
  modifiedAt: Date;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    [key: string]: any;
  };
  tags: string[];
  source: 'local' | 'google-drive' | 'dropbox' | 'aws-s3';
  thumbnailPath?: string;
  isProcessing?: boolean;
}

export interface DuplicateGroup {
  id: string;
  files: MediaFile[];
  type: 'exact' | 'perceptual' | 'near-duplicate';
  similarity: number; // 0-100
  primaryFile?: MediaFile; // User-selected or algorithm-determined primary
  createdAt: Date;
  verified: boolean; // User has manually verified this group
}

export interface ScanProgress {
  total: number;
  processed: number;
  current: string;
  stage: 'scanning' | 'hashing' | 'comparing' | 'generating-thumbnails' | 'complete';
  duplicatesFound: number;
}

export interface FilterOptions {
  fileTypes: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sizeRange: {
    min?: number;
    max?: number;
  };
  sources: string[];
  tags: string[];
  duplicateType: 'all' | 'exact' | 'perceptual' | 'near-duplicate';
  verified?: boolean;
}

export interface ExportReport {
  id: string;
  createdAt: Date;
  totalFiles: number;
  duplicateGroups: number;
  potentialSpaceSaved: number;
  format: 'json' | 'csv' | 'pdf';
  filters: FilterOptions;
}

export interface CloudConfig {
  googleDrive?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  dropbox?: {
    accessToken: string;
  };
  awsS3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
}

export interface ProcessingJob {
  id: string;
  type: 'scan' | 'hash' | 'compare' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}