import { Dropbox } from 'dropbox';
import { MediaFile } from '@/types/media';
import { v4 as uuidv4 } from 'uuid';

export interface DropboxConfig {
  accessToken: string;
  clientId?: string;
  clientSecret?: string;
}

export class DropboxProvider {
  private dropbox: Dropbox;
  private config: DropboxConfig;

  constructor(config: DropboxConfig) {
    this.config = config;
    this.dropbox = new Dropbox({ 
      accessToken: config.accessToken,
      clientId: config.clientId,
      clientSecret: config.clientSecret
    });
  }

  /**
   * List media files from Dropbox
   */
  async listMediaFiles(
    folderPath: string = '',
    onProgress?: (processed: number, total: number, current: string) => void
  ): Promise<MediaFile[]> {
    const mediaFiles: MediaFile[] = [];
    let cursor: string | undefined;
    let totalProcessed = 0;

    try {
      // Start listing files
      let response = await this.dropbox.filesListFolder({
        path: folderPath,
        recursive: true,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      });

      do {
        const entries = response.result.entries;

        for (const entry of entries) {
          if (entry['.tag'] === 'file' && this.isMediaFile(entry.name)) {
            try {
              const mediaFile = await this.convertToMediaFile(entry as any);
              mediaFiles.push(mediaFile);
              totalProcessed++;

              if (onProgress) {
                onProgress(totalProcessed, -1, entry.name);
              }
            } catch (error) {
              console.error(`Error processing file ${entry.name}:`, error);
            }
          }
        }

        // Continue with next batch if there are more files
        if (response.result.has_more) {
          response = await this.dropbox.filesListFolderContinue({
            cursor: response.result.cursor
          });
        } else {
          break;
        }
      } while (true);

      return mediaFiles;
    } catch (error) {
      console.error('Error listing Dropbox files:', error);
      throw new Error(`Failed to list Dropbox files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download file content from Dropbox
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const response = await this.dropbox.filesDownload({ path: filePath });
      
      // The response contains the file content in the fileBinary property
      if ('fileBinary' in response.result) {
        return Buffer.from(response.result.fileBinary as any);
      } else {
        throw new Error('File binary data not found in response');
      }
    } catch (error) {
      console.error(`Error downloading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata from Dropbox
   */
  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const response = await this.dropbox.filesGetMetadata({
        path: filePath,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      });

      return response.result;
    } catch (error) {
      console.error(`Error getting metadata for file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Search for files by name
   */
  async searchFiles(query: string, folderPath: string = ''): Promise<MediaFile[]> {
    try {
      const response = await this.dropbox.filesSearchV2({
        query,
        options: {
          path: folderPath || undefined,
          max_results: 100,
          file_status: 'active',
          filename_only: true
        }
      });

      const mediaFiles: MediaFile[] = [];

      for (const match of response.result.matches) {
        if (match.metadata.metadata['.tag'] === 'file') {
          const file = match.metadata.metadata as any;
          
          if (this.isMediaFile(file.name)) {
            try {
              const mediaFile = await this.convertToMediaFile(file);
              mediaFiles.push(mediaFile);
            } catch (error) {
              console.error(`Error processing search result ${file.name}:`, error);
            }
          }
        }
      }

      return mediaFiles;
    } catch (error) {
      console.error('Error searching Dropbox files:', error);
      throw error;
    }
  }

  /**
   * Get folder structure
   */
  async getFolders(parentPath: string = ''): Promise<Array<{ path: string; name: string; parentPath: string }>> {
    try {
      const response = await this.dropbox.filesListFolder({
        path: parentPath,
        recursive: false,
        include_deleted: false
      });

      const folders = response.result.entries
        .filter(entry => entry['.tag'] === 'folder')
        .map(folder => ({
          path: folder.path_lower!,
          name: folder.name,
          parentPath
        }));

      return folders;
    } catch (error) {
      console.error('Error getting Dropbox folders:', error);
      throw error;
    }
  }

  /**
   * Get temporary download link
   */
  async getTemporaryLink(filePath: string): Promise<string> {
    try {
      const response = await this.dropbox.filesGetTemporaryLink({ path: filePath });
      return response.result.link;
    } catch (error) {
      console.error(`Error getting temporary link for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get sharing link
   */
  async getSharingLink(filePath: string): Promise<string> {
    try {
      // Try to get existing shared link first
      try {
        const response = await this.dropbox.sharingListSharedLinks({
          path: filePath,
          direct_only: true
        });
        
        if (response.result.links.length > 0) {
          return response.result.links[0].url;
        }
      } catch {
        // No existing shared link, create new one
      }

      // Create new shared link
      const response = await this.dropbox.sharingCreateSharedLinkWithSettings({
        path: filePath,
        settings: {
          requested_visibility: 'public',
          audience: 'public',
          access: 'viewer'
        }
      });

      return response.result.url;
    } catch (error) {
      console.error(`Error getting sharing link for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Convert Dropbox file to MediaFile format
   */
  private async convertToMediaFile(dropboxFile: any): Promise<MediaFile> {
    const fileType = this.getFileType(dropboxFile.name);
    let dimensions: { width: number; height: number } | undefined;
    const metadata: { [key: string]: any } = {};

    // Extract dimensions and metadata from media info
    if (dropboxFile.media_info) {
      if (dropboxFile.media_info['.tag'] === 'photo' && dropboxFile.media_info.photo) {
        const photo = dropboxFile.media_info.photo;
        if (photo.dimensions) {
          dimensions = {
            width: photo.dimensions.width,
            height: photo.dimensions.height
          };
        }
        
        if (photo.location) {
          metadata.location = photo.location;
        }
        
        if (photo.time_taken) {
          metadata.dateTime = photo.time_taken;
        }
      } else if (dropboxFile.media_info['.tag'] === 'video' && dropboxFile.media_info.video) {
        const video = dropboxFile.media_info.video;
        if (video.dimensions) {
          dimensions = {
            width: video.dimensions.width,
            height: video.dimensions.height
          };
        }
        
        if (video.duration) {
          metadata.duration = video.duration;
        }
        
        if (video.location) {
          metadata.location = video.location;
        }
        
        if (video.time_taken) {
          metadata.dateTime = video.time_taken;
        }
      }
    }

    // Generate hash from content hash if available
    let hash = '';
    if (dropboxFile.content_hash) {
      hash = dropboxFile.content_hash;
    } else {
      // Fallback: use path and size as a simple identifier
      hash = this.generateSimpleHash(dropboxFile.path_lower + dropboxFile.size);
    }

    const mediaFile: MediaFile = {
      id: uuidv4(),
      name: dropboxFile.name,
      path: dropboxFile.path_lower,
      size: dropboxFile.size,
      type: fileType,
      mimeType: this.getMimeType(dropboxFile.name),
      hash,
      createdAt: new Date(dropboxFile.client_modified),
      modifiedAt: new Date(dropboxFile.server_modified),
      dimensions,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      tags: [],
      source: 'dropbox'
    };

    return mediaFile;
  }

  /**
   * Check if file is a media file based on extension
   */
  private isMediaFile(filename: string): boolean {
    const mediaExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg',
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
    ];
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return mediaExtensions.includes(ext);
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
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
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
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
   * Generate simple hash from string
   */
  private generateSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if the provider is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.config.accessToken;
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<{
    accountId: string;
    name: string;
    email: string;
    country?: string;
  }> {
    try {
      const response = await this.dropbox.usersGetCurrentAccount();
      
      return {
        accountId: response.result.account_id,
        name: response.result.name.display_name,
        email: response.result.email,
        country: response.result.country
      };
    } catch (error) {
      console.error('Error getting Dropbox account info:', error);
      throw error;
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageInfo(): Promise<{
    allocated: number;
    used: number;
    available: number;
  }> {
    try {
      const response = await this.dropbox.usersGetSpaceUsage();
      
      const used = response.result.used;
      let allocated = 0;
      
      if (response.result.allocation['.tag'] === 'individual') {
        allocated = response.result.allocation.individual.allocated;
      } else if (response.result.allocation['.tag'] === 'team') {
        allocated = response.result.allocation.team.allocated;
      }
      
      return {
        allocated,
        used,
        available: allocated - used
      };
    } catch (error) {
      console.error('Error getting Dropbox storage info:', error);
      throw error;
    }
  }
}