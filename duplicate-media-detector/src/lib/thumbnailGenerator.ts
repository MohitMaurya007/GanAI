import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import { MediaFile } from '@/types/media';

export class ThumbnailGenerator {
  private thumbnailDir: string;
  private thumbnailSize = { width: 200, height: 200 };
  private videoThumbnailSize = { width: 320, height: 240 };

  constructor(thumbnailDir?: string) {
    this.thumbnailDir = thumbnailDir || path.join(process.cwd(), 'thumbnails');
    this.ensureThumbnailDirectory();
  }

  private async ensureThumbnailDirectory() {
    try {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('Error creating thumbnail directory:', error);
    }
  }

  /**
   * Generate thumbnail for a media file
   */
  async generateThumbnail(file: MediaFile): Promise<string | null> {
    try {
      const thumbnailPath = this.getThumbnailPath(file);
      
      // Check if thumbnail already exists
      try {
        await fs.access(thumbnailPath);
        return thumbnailPath; // Thumbnail already exists
      } catch {
        // Thumbnail doesn't exist, create it
      }

      if (file.type === 'image') {
        return await this.generateImageThumbnail(file, thumbnailPath);
      } else if (file.type === 'video') {
        return await this.generateVideoThumbnail(file, thumbnailPath);
      }

      return null;
    } catch (error) {
      console.error(`Error generating thumbnail for ${file.name}:`, error);
      return null;
    }
  }

  /**
   * Generate thumbnails for multiple files in parallel
   */
  async generateThumbnails(
    files: MediaFile[],
    onProgress?: (processed: number, total: number, current: string) => void
  ): Promise<void> {
    const batchSize = 10; // Process in batches to avoid overwhelming the system
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, Math.min(i + batchSize, files.length));
      
      const promises = batch.map(async (file) => {
        const thumbnailPath = await this.generateThumbnail(file);
        if (thumbnailPath) {
          file.thumbnailPath = thumbnailPath;
        }
        
        if (onProgress) {
          onProgress(i + batch.indexOf(file) + 1, files.length, file.name);
        }
        
        return file;
      });

      await Promise.all(promises);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Generate thumbnail for image files
   */
  private async generateImageThumbnail(file: MediaFile, thumbnailPath: string): Promise<string> {
    try {
      await sharp(file.path)
        .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error(`Error generating image thumbnail for ${file.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for video files
   */
  private async generateVideoThumbnail(file: MediaFile, thumbnailPath: string): Promise<string> {
    try {
      // For video thumbnails, we'll use ffmpeg if available
      // This is a simplified version - in production, you'd want to use ffmpeg
      const ffmpeg = require('fluent-ffmpeg');
      
      return new Promise<string>((resolve, reject) => {
        ffmpeg(file.path)
          .screenshots({
            count: 1,
            folder: path.dirname(thumbnailPath),
            filename: path.basename(thumbnailPath, '.jpg') + '.jpg',
            size: `${this.videoThumbnailSize.width}x${this.videoThumbnailSize.height}`
          })
          .on('end', () => {
            resolve(thumbnailPath);
          })
          .on('error', (error: Error) => {
            // Fallback: create a placeholder thumbnail
            this.createPlaceholderThumbnail(thumbnailPath, 'video')
              .then(() => resolve(thumbnailPath))
              .catch(reject);
          });
      });
    } catch (error) {
      // Create placeholder thumbnail if ffmpeg is not available
      await this.createPlaceholderThumbnail(thumbnailPath, 'video');
      return thumbnailPath;
    }
  }

  /**
   * Create a placeholder thumbnail
   */
  private async createPlaceholderThumbnail(thumbnailPath: string, type: 'image' | 'video'): Promise<void> {
    const color = type === 'video' ? '#6366f1' : '#10b981'; // Blue for video, green for image
    const text = type === 'video' ? '▶' : '🖼';

    try {
      // Create a simple colored rectangle with an icon
      const svg = `
        <svg width="${this.thumbnailSize.width}" height="${this.thumbnailSize.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${text}
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .png()
        .toFile(thumbnailPath);
    } catch (error) {
      console.error('Error creating placeholder thumbnail:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail path for a file
   */
  private getThumbnailPath(file: MediaFile): string {
    const hash = file.hash.substring(0, 8); // Use first 8 chars of hash
    const extension = '.jpg';
    return path.join(this.thumbnailDir, `${hash}${extension}`);
  }

  /**
   * Clean up old thumbnails
   */
  async cleanupThumbnails(activeFiles: MediaFile[]): Promise<void> {
    try {
      const activeHashes = new Set(activeFiles.map(f => f.hash.substring(0, 8)));
      const thumbnailFiles = await fs.readdir(this.thumbnailDir);

      const deletionPromises = thumbnailFiles
        .filter(filename => {
          const hash = path.basename(filename, path.extname(filename));
          return !activeHashes.has(hash);
        })
        .map(filename => {
          const filePath = path.join(this.thumbnailDir, filename);
          return fs.unlink(filePath).catch(error => {
            console.warn(`Could not delete thumbnail ${filename}:`, error);
          });
        });

      await Promise.all(deletionPromises);
    } catch (error) {
      console.error('Error cleaning up thumbnails:', error);
    }
  }

  /**
   * Get thumbnail URL for serving via web
   */
  getThumbnailUrl(file: MediaFile): string | null {
    if (!file.thumbnailPath) return null;
    
    // Convert file path to URL path
    const relativePath = path.relative(process.cwd(), file.thumbnailPath);
    return `/${relativePath.replace(/\\/g, '/')}`; // Ensure forward slashes for URLs
  }

  /**
   * Check if thumbnail exists for a file
   */
  async thumbnailExists(file: MediaFile): Promise<boolean> {
    try {
      const thumbnailPath = this.getThumbnailPath(file);
      await fs.access(thumbnailPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get thumbnail stats
   */
  async getThumbnailStats(): Promise<{
    totalThumbnails: number;
    totalSize: number;
    oldestThumbnail?: Date;
    newestThumbnail?: Date;
  }> {
    try {
      const thumbnailFiles = await fs.readdir(this.thumbnailDir);
      let totalSize = 0;
      let oldestDate: Date | undefined;
      let newestDate: Date | undefined;

      const statPromises = thumbnailFiles.map(async (filename) => {
        const filePath = path.join(this.thumbnailDir, filename);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        if (!oldestDate || stats.mtime < oldestDate) {
          oldestDate = stats.mtime;
        }
        
        if (!newestDate || stats.mtime > newestDate) {
          newestDate = stats.mtime;
        }
      });

      await Promise.all(statPromises);

      return {
        totalThumbnails: thumbnailFiles.length,
        totalSize,
        oldestThumbnail: oldestDate,
        newestThumbnail: newestDate
      };
    } catch (error) {
      console.error('Error getting thumbnail stats:', error);
      return {
        totalThumbnails: 0,
        totalSize: 0
      };
    }
  }
}