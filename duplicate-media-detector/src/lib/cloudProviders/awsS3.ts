import AWS from 'aws-sdk';
import { MediaFile } from '@/types/media';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface AWSS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string; // For custom S3-compatible services
}

export class AWSS3Provider {
  private s3: AWS.S3;
  private config: AWSS3Config;

  constructor(config: AWSS3Config) {
    this.config = config;
    
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });

    this.s3 = new AWS.S3({
      endpoint: config.endpoint,
      s3ForcePathStyle: !!config.endpoint // Required for some S3-compatible services
    });
  }

  /**
   * List media files from S3 bucket
   */
  async listMediaFiles(
    prefix: string = '',
    onProgress?: (processed: number, total: number, current: string) => void
  ): Promise<MediaFile[]> {
    const mediaFiles: MediaFile[] = [];
    let continuationToken: string | undefined;
    let totalProcessed = 0;

    try {
      do {
        const response = await this.s3.listObjectsV2({
          Bucket: this.config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000
        }).promise();

        const objects = response.Contents || [];

        for (const object of objects) {
          if (object.Key && this.isMediaFile(object.Key)) {
            try {
              const mediaFile = await this.convertToMediaFile(object);
              mediaFiles.push(mediaFile);
              totalProcessed++;

              if (onProgress) {
                onProgress(totalProcessed, response.KeyCount || -1, path.basename(object.Key));
              }
            } catch (error) {
              console.error(`Error processing file ${object.Key}:`, error);
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return mediaFiles;
    } catch (error) {
      console.error('Error listing S3 files:', error);
      throw new Error(`Failed to list S3 files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file content from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const response = await this.s3.getObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      if (response.Body instanceof Buffer) {
        return response.Body;
      } else if (response.Body) {
        return Buffer.from(response.Body as any);
      } else {
        throw new Error('No file content received');
      }
    } catch (error) {
      console.error(`Error downloading file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const response = await this.s3.headObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      return response;
    } catch (error) {
      console.error(`Error getting metadata for file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Search for files by prefix (S3 doesn't support full-text search)
   */
  async searchFiles(prefix: string): Promise<MediaFile[]> {
    return this.listMediaFiles(prefix);
  }

  /**
   * Get folder structure (S3 uses prefixes, not real folders)
   */
  async getFolders(prefix: string = ''): Promise<Array<{ prefix: string; name: string; parentPrefix: string }>> {
    try {
      const response = await this.s3.listObjectsV2({
        Bucket: this.config.bucket,
        Prefix: prefix,
        Delimiter: '/'
      }).promise();

      const folders = (response.CommonPrefixes || []).map(commonPrefix => {
        const fullPrefix = commonPrefix.Prefix!;
        const name = fullPrefix.slice(prefix.length).replace('/', '');
        
        return {
          prefix: fullPrefix,
          name,
          parentPrefix: prefix
        };
      });

      return folders;
    } catch (error) {
      console.error('Error getting S3 folders:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for file access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.config.bucket,
        Key: key,
        Expires: expiresIn
      });

      return url;
    } catch (error) {
      console.error(`Error getting presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get file tags from S3
   */
  async getFileTags(key: string): Promise<string[]> {
    try {
      const response = await this.s3.getObjectTagging({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      return response.TagSet?.map(tag => `${tag.Key}:${tag.Value}`) || [];
    } catch (error) {
      console.warn(`Could not get tags for ${key}:`, error);
      return [];
    }
  }

  /**
   * Set file tags in S3
   */
  async setFileTags(key: string, tags: { [key: string]: string }): Promise<void> {
    try {
      const tagSet = Object.entries(tags).map(([key, value]) => ({
        Key: key,
        Value: value
      }));

      await this.s3.putObjectTagging({
        Bucket: this.config.bucket,
        Key: key,
        Tagging: { TagSet: tagSet }
      }).promise();
    } catch (error) {
      console.error(`Error setting tags for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();
    } catch (error) {
      console.error(`Error deleting file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Convert S3 object to MediaFile format
   */
  private async convertToMediaFile(s3Object: AWS.S3.Object): Promise<MediaFile> {
    if (!s3Object.Key) {
      throw new Error('S3 object missing key');
    }

    const fileName = path.basename(s3Object.Key);
    const fileType = this.getFileType(fileName);
    const mimeType = this.getMimeType(fileName);

    // Get additional metadata
    let metadata: { [key: string]: any } | undefined;
    let dimensions: { width: number; height: number } | undefined;
    
    try {
      const headResponse = await this.getFileMetadata(s3Object.Key);
      
      // Extract custom metadata
      if (headResponse.Metadata) {
        metadata = { ...headResponse.Metadata };
        
        // Parse dimensions if available
        if (metadata.width && metadata.height) {
          dimensions = {
            width: parseInt(metadata.width),
            height: parseInt(metadata.height)
          };
        }
      }
    } catch (error) {
      console.warn(`Could not get extended metadata for ${s3Object.Key}:`, error);
    }

    // Get tags
    const tags = await this.getFileTags(s3Object.Key);

    const mediaFile: MediaFile = {
      id: uuidv4(),
      name: fileName,
      path: s3Object.Key,
      size: s3Object.Size || 0,
      type: fileType,
      mimeType,
      hash: s3Object.ETag?.replace(/"/g, '') || '', // ETag is similar to MD5 for simple uploads
      createdAt: s3Object.LastModified || new Date(),
      modifiedAt: s3Object.LastModified || new Date(),
      dimensions,
      metadata,
      tags,
      source: 'aws-s3'
    };

    return mediaFile;
  }

  /**
   * Check if file is a media file based on extension
   */
  private isMediaFile(key: string): boolean {
    const mediaExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg',
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
    ];
    
    const ext = path.extname(key).toLowerCase();
    return mediaExtensions.includes(ext);
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'];
    
    if (imageExtensions.includes(ext)) return 'image';
    if (videoExtensions.includes(ext)) return 'video';
    return 'other';
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
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
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if the provider is configured
   */
  isConfigured(): boolean {
    return !!(this.config.accessKeyId && this.config.secretAccessKey && this.config.bucket);
  }

  /**
   * Test connection to S3
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }

  /**
   * Get bucket information
   */
  async getBucketInfo(): Promise<{
    name: string;
    region?: string;
    creationDate?: Date;
  }> {
    try {
      const response = await this.s3.getBucketLocation({
        Bucket: this.config.bucket
      }).promise();

      return {
        name: this.config.bucket,
        region: response.LocationConstraint || this.config.region,
        creationDate: undefined // S3 doesn't provide creation date in this API
      };
    } catch (error) {
      console.error('Error getting bucket info:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics (approximation)
   */
  async getStorageStats(): Promise<{
    objectCount: number;
    totalSize: number;
  }> {
    try {
      let objectCount = 0;
      let totalSize = 0;
      let continuationToken: string | undefined;

      do {
        const response = await this.s3.listObjectsV2({
          Bucket: this.config.bucket,
          ContinuationToken: continuationToken,
          MaxKeys: 1000
        }).promise();

        const objects = response.Contents || [];
        objectCount += objects.length;
        totalSize += objects.reduce((sum, obj) => sum + (obj.Size || 0), 0);

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return { objectCount, totalSize };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}