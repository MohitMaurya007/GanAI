import { google } from 'googleapis';
import { MediaFile } from '@/types/media';
import { Readable } from 'stream';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
  accessToken?: string;
}

export class GoogleDriveProvider {
  private drive: any;
  private auth: any;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.initializeAuth();
  }

  private initializeAuth() {
    this.auth = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );

    if (this.config.refreshToken) {
      this.auth.setCredentials({
        refresh_token: this.config.refreshToken,
        access_token: this.config.accessToken
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
  }

  /**
   * List media files from Google Drive
   */
  async listMediaFiles(
    folderId?: string,
    onProgress?: (processed: number, total: number, current: string) => void
  ): Promise<MediaFile[]> {
    const mediaFiles: MediaFile[] = [];
    let pageToken: string | undefined;
    let totalProcessed = 0;

    // Supported media file MIME types
    const mediaTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/webm'
    ];

    const mimeTypeQuery = mediaTypes.map(type => `mimeType='${type}'`).join(' or ');
    let query = `(${mimeTypeQuery}) and trashed=false`;
    
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    try {
      do {
        const response = await this.drive.files.list({
          q: query,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, imageMediaMetadata, videoMediaMetadata, md5Checksum)',
          pageSize: 100,
          pageToken
        });

        const files = response.data.files || [];
        
        for (const file of files) {
          try {
            const mediaFile = await this.convertToMediaFile(file);
            mediaFiles.push(mediaFile);
            totalProcessed++;

            if (onProgress) {
              onProgress(totalProcessed, -1, file.name); // -1 indicates unknown total
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);

      return mediaFiles;
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw new Error(`Failed to list Google Drive files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file content from Google Drive
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        response.data.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.data.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata from Google Drive
   */
  async getFileMetadata(fileId: string): Promise<any> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents, imageMediaMetadata, videoMediaMetadata, md5Checksum'
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting metadata for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Search for files by name or content
   */
  async searchFiles(query: string): Promise<MediaFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, parents, imageMediaMetadata, videoMediaMetadata, md5Checksum)'
      });

      const files = response.data.files || [];
      const mediaFiles: MediaFile[] = [];

      for (const file of files) {
        try {
          const mediaFile = await this.convertToMediaFile(file);
          mediaFiles.push(mediaFile);
        } catch (error) {
          console.error(`Error processing search result ${file.name}:`, error);
        }
      }

      return mediaFiles;
    } catch (error) {
      console.error('Error searching Google Drive files:', error);
      throw error;
    }
  }

  /**
   * Get folder structure
   */
  async getFolders(parentId?: string): Promise<Array<{ id: string; name: string; parentId?: string }>> {
    try {
      let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        orderBy: 'name'
      });

      return (response.data.files || []).map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parents?.[0]
      }));
    } catch (error) {
      console.error('Error getting Google Drive folders:', error);
      throw error;
    }
  }

  /**
   * Convert Google Drive file to MediaFile format
   */
  private async convertToMediaFile(driveFile: any): Promise<MediaFile> {
    const fileType = this.getFileType(driveFile.mimeType);
    let dimensions: { width: number; height: number } | undefined;

    // Extract dimensions from metadata
    if (driveFile.imageMediaMetadata) {
      dimensions = {
        width: driveFile.imageMediaMetadata.width,
        height: driveFile.imageMediaMetadata.height
      };
    } else if (driveFile.videoMediaMetadata) {
      dimensions = {
        width: driveFile.videoMediaMetadata.width,
        height: driveFile.videoMediaMetadata.height
      };
    }

    // Extract additional metadata
    const metadata: { [key: string]: any } = {};
    
    if (driveFile.imageMediaMetadata) {
      if (driveFile.imageMediaMetadata.location) {
        metadata.location = driveFile.imageMediaMetadata.location;
      }
      if (driveFile.imageMediaMetadata.time) {
        metadata.dateTime = driveFile.imageMediaMetadata.time;
      }
      if (driveFile.imageMediaMetadata.cameraMake) {
        metadata.cameraMake = driveFile.imageMediaMetadata.cameraMake;
      }
      if (driveFile.imageMediaMetadata.cameraModel) {
        metadata.cameraModel = driveFile.imageMediaMetadata.cameraModel;
      }
    }

    if (driveFile.videoMediaMetadata) {
      if (driveFile.videoMediaMetadata.durationMillis) {
        metadata.duration = driveFile.videoMediaMetadata.durationMillis;
      }
    }

    const mediaFile: MediaFile = {
      id: uuidv4(),
      name: driveFile.name,
      path: `gdrive://${driveFile.id}`, // Virtual path for Google Drive
      size: parseInt(driveFile.size) || 0,
      type: fileType,
      mimeType: driveFile.mimeType,
      hash: driveFile.md5Checksum || '', // Google Drive provides MD5 checksum
      createdAt: new Date(driveFile.createdTime),
      modifiedAt: new Date(driveFile.modifiedTime),
      dimensions,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      tags: [],
      source: 'google-drive'
    };

    return mediaFile;
  }

  /**
   * Get file type from MIME type
   */
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
  }

  /**
   * Check if the provider is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.config.accessToken || this.config.refreshToken);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const { credentials } = await this.auth.refreshAccessToken();
      this.config.accessToken = credentials.access_token;
      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing Google Drive access token:', error);
      throw error;
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageInfo(): Promise<{
    limit: number;
    usage: number;
    usageInDrive: number;
  }> {
    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota'
      });

      const quota = response.data.storageQuota;
      
      return {
        limit: parseInt(quota.limit) || 0,
        usage: parseInt(quota.usage) || 0,
        usageInDrive: parseInt(quota.usageInDrive) || 0
      };
    } catch (error) {
      console.error('Error getting Google Drive storage info:', error);
      throw error;
    }
  }
}