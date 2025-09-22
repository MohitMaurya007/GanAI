import { UserRole, MediaType, DuplicateStatus, ProcessingStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface MediaFileUpload {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  buffer: Buffer;
}

export interface MediaFeatureExtraction {
  faces?: FaceFeature[];
  objects?: ObjectFeature[];
  sceneEmbedding?: number[];
  dominantColors?: ColorFeature[];
  audioFingerprint?: string;
  speechText?: string;
  audioEmbedding?: number[];
  keyframes?: KeyframeFeature[];
  motionVectors?: MotionFeature[];
}

export interface FaceFeature {
  boundingBox: BoundingBox;
  embedding: number[];
  confidence: number;
  landmarks?: FaceLandmark[];
}

export interface ObjectFeature {
  class: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface ColorFeature {
  rgb: [number, number, number];
  percentage: number;
}

export interface KeyframeFeature {
  timestamp: number;
  embedding: number[];
}

export interface MotionFeature {
  timestamp: number;
  vectors: number[][];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  type: string;
}

export interface SimilarityResult {
  originalFileId: string;
  duplicateFileId: string;
  overallSimilarity: number;
  faceSimilarity?: number;
  objectSimilarity?: number;
  sceneSimilarity?: number;
  audioSimilarity?: number;
  matchType: string;
  confidence: number;
}

export interface ProcessingJobData {
  mediaFileId?: string;
  jobType: string;
  inputData?: any;
  priority?: number;
}

export interface UserSettingsUpdate {
  faceThreshold?: number;
  objectThreshold?: number;
  sceneThreshold?: number;
  audioThreshold?: number;
  autoProcessDuplicates?: boolean;
  enableFaceDetection?: boolean;
  enableObjectDetection?: boolean;
  enableSceneAnalysis?: boolean;
  enableAudioFingerprinting?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface DuplicateReviewData {
  decision: DuplicateStatus;
  notes?: string;
  confidence?: number;
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
  dateFrom?: Date;
  dateTo?: Date;
  minSimilarity?: number;
  maxSimilarity?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FileProcessingOptions {
  extractFeatures?: boolean;
  findDuplicates?: boolean;
  generateThumbnail?: boolean;
  priority?: number;
}

export interface SystemMetrics {
  totalFiles: number;
  totalDuplicates: number;
  storageUsed: number;
  processingQueue: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface MLServiceResponse<T = any> {
  success: boolean;
  data?: T;
  processingTime: number;
  error?: string;
}

export interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      files?: Express.Multer.File[];
    }
  }
}

export interface UploadedFile extends Express.Multer.File {
  id?: string;
  processed?: boolean;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}