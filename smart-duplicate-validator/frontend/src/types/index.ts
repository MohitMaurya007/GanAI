// User types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STANDARD_USER = 'STANDARD_USER',
  REVIEWER = 'REVIEWER'
}

export interface UserSettings {
  faceThreshold: number;
  objectThreshold: number;
  sceneThreshold: number;
  audioThreshold: number;
  autoProcessDuplicates: boolean;
  enableFaceDetection: boolean;
  enableObjectDetection: boolean;
  enableSceneAnalysis: boolean;
  enableAudioFingerprinting: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Media types
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface MediaFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  filePath: string;
  thumbnailPath?: string;
  md5Hash: string;
  sha256Hash: string;
  perceptualHash?: string;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  framerate?: number;
  processingStatus: ProcessingStatus;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
  features?: MediaFeatures;
}

export interface MediaFeatures {
  id: string;
  mediaFileId: string;
  faces?: any[];
  faceCount: number;
  objects?: any[];
  objectCount: number;
  sceneEmbedding?: number[];
  dominantColors?: ColorFeature[];
  audioFingerprint?: string;
  speechText?: string;
  audioEmbedding?: number[];
  keyframes?: any[];
  motionVectors?: any[];
}

export interface ColorFeature {
  rgb: [number, number, number];
  percentage: number;
}

// Duplicate types
export enum DuplicateStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  AUTO_PROCESSED = 'AUTO_PROCESSED'
}

export interface DuplicateMatch {
  id: string;
  originalFileId: string;
  duplicateFileId: string;
  originalFile: MediaFile;
  duplicateFile: MediaFile;
  overallSimilarity: number;
  faceSimilarity?: number;
  objectSimilarity?: number;
  sceneSimilarity?: number;
  audioSimilarity?: number;
  matchType: string;
  confidence: number;
  status: DuplicateStatus;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviews?: DuplicateReview[];
}

export interface DuplicateReview {
  id: string;
  duplicateMatchId: string;
  reviewerId: string;
  reviewer: User;
  decision: DuplicateStatus;
  notes?: string;
  confidence?: number;
  createdAt: string;
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  mediaType?: MediaType;
  status?: DuplicateStatus | ProcessingStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minSimilarity?: number;
  maxSimilarity?: number;
}

// UI types
export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ProcessingUpdate {
  mediaFileId: string;
  status: string;
  progress?: number;
  error?: string;
}

// System types
export interface SystemStats {
  totalFiles: number;
  totalDuplicates: number;
  storageUsed: number;
  processingQueue: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

// Theme types
export interface ThemeState {
  mode: 'light' | 'dark';
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  title?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'file';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}