import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { MediaFile, ScanProgress } from '@/types/media';
import { HashingService } from './hashing';
import { v4 as uuidv4 } from 'uuid';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export class FileScanner {
  private supportedExtensions = new Set([
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg',
    // Videos
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
  ]);

  private onProgress?: (progress: ScanProgress) => void;
  private shouldStop = false;

  constructor(onProgress?: (progress: ScanProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Scan directory recursively for media files
   */
  async scanDirectory(directoryPath: string): Promise<MediaFile[]> {
    const files: MediaFile[] = [];
    this.shouldStop = false;

    try {
      const allFiles = await this.getAllFiles(directoryPath);
      const mediaFiles = allFiles.filter(file => 
        this.supportedExtensions.has(path.extname(file).toLowerCase())
      );

      this.updateProgress({
        total: mediaFiles.length,
        processed: 0,
        current: '',
        stage: 'hashing',
        duplicatesFound: 0
      });

      for (let i = 0; i < mediaFiles.length; i++) {
        if (this.shouldStop) break;

        const filePath = mediaFiles[i];
        
        try {
          const mediaFile = await this.processFile(filePath);
          files.push(mediaFile);

          this.updateProgress({
            total: mediaFiles.length,
            processed: i + 1,
            current: path.basename(filePath),
            stage: 'hashing',
            duplicatesFound: 0
          });
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }

      this.updateProgress({
        total: mediaFiles.length,
        processed: mediaFiles.length,
        current: '',
        stage: 'complete',
        duplicatesFound: 0
      });

      return files;
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw error;
    }
  }

  /**
   * Process multiple files from file list
   */
  async processFiles(filePaths: string[]): Promise<MediaFile[]> {
    const files: MediaFile[] = [];
    this.shouldStop = false;

    this.updateProgress({
      total: filePaths.length,
      processed: 0,
      current: '',
      stage: 'hashing',
      duplicatesFound: 0
    });

    for (let i = 0; i < filePaths.length; i++) {
      if (this.shouldStop) break;

      const filePath = filePaths[i];
      
      try {
        const mediaFile = await this.processFile(filePath);
        files.push(mediaFile);

        this.updateProgress({
          total: filePaths.length,
          processed: i + 1,
          current: path.basename(filePath),
          stage: 'hashing',
          duplicatesFound: 0
        });
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    this.updateProgress({
      total: filePaths.length,
      processed: filePaths.length,
      current: '',
      stage: 'complete',
      duplicatesFound: 0
    });

    return files;
  }

  /**
   * Process a single file and extract metadata
   */
  private async processFile(filePath: string): Promise<MediaFile> {
    const stats = await stat(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = this.getMimeType(extension);
    
    // Generate hashes
    const hashes = await HashingService.generateAllHashes(filePath);
    
    // Get image dimensions if it's an image
    let dimensions: { width: number; height: number } | undefined;
    if (mimeType.startsWith('image/')) {
      dimensions = await this.getImageDimensions(filePath);
    }

    // Extract EXIF data for images
    let metadata: { [key: string]: any } | undefined;
    if (mimeType.startsWith('image/')) {
      metadata = await this.extractImageMetadata(filePath);
    }

    const mediaFile: MediaFile = {
      id: uuidv4(),
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      type: this.getFileType(mimeType),
      mimeType,
      hash: hashes.md5,
      perceptualHash: hashes.perceptual,
      createdAt: stats.birthtime || stats.ctime,
      modifiedAt: stats.mtime,
      dimensions,
      metadata,
      tags: [],
      source: 'local'
    };

    return mediaFile;
  }

  /**
   * Get all files recursively from directory
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scanDir(currentDir: string) {
      try {
        const items = await readdir(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stats = await stat(fullPath);
          
          if (stats.isDirectory()) {
            await scanDir(fullPath);
          } else if (stats.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${currentDir}:`, error);
      }
    }
    
    await scanDir(dir);
    return files;
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();
      
      if (metadata.width && metadata.height) {
        return {
          width: metadata.width,
          height: metadata.height
        };
      }
    } catch (error) {
      console.warn(`Could not get dimensions for ${filePath}:`, error);
    }
    
    return undefined;
  }

  /**
   * Extract image metadata (EXIF, etc.)
   */
  private async extractImageMetadata(filePath: string): Promise<{ [key: string]: any } | undefined> {
    try {
      // Using exifr library for comprehensive metadata extraction
      const exifr = require('exifr');
      const metadata = await exifr.parse(filePath);
      
      if (metadata) {
        // Clean up and format metadata
        const cleanMetadata: { [key: string]: any } = {};
        
        // Common EXIF fields
        if (metadata.Make) cleanMetadata.cameraMake = metadata.Make;
        if (metadata.Model) cleanMetadata.cameraModel = metadata.Model;
        if (metadata.DateTime) cleanMetadata.dateTime = metadata.DateTime;
        if (metadata.GPS) cleanMetadata.location = metadata.GPS;
        if (metadata.ISO) cleanMetadata.iso = metadata.ISO;
        if (metadata.FNumber) cleanMetadata.aperture = metadata.FNumber;
        if (metadata.ExposureTime) cleanMetadata.exposureTime = metadata.ExposureTime;
        if (metadata.FocalLength) cleanMetadata.focalLength = metadata.FocalLength;
        
        return Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined;
      }
    } catch (error) {
      console.warn(`Could not extract metadata for ${filePath}:`, error);
    }
    
    return undefined;
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.m4v': 'video/mp4',
      '.3gp': 'video/3gpp'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Get file type category
   */
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: ScanProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Stop scanning process
   */
  stop() {
    this.shouldStop = true;
  }

  /**
   * Check if file is supported media type
   */
  static isMediaFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    const supportedExtensions = new Set([
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg',
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
    ]);
    
    return supportedExtensions.has(extension);
  }
}