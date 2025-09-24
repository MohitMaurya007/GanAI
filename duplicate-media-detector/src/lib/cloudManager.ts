import { GoogleDriveProvider, GoogleDriveConfig } from './cloudProviders/googleDrive';
import { DropboxProvider, DropboxConfig } from './cloudProviders/dropbox';
import { AWSS3Provider, AWSS3Config } from './cloudProviders/awsS3';
import { MediaFile, CloudConfig } from '@/types/media';

export type CloudProviderType = 'google-drive' | 'dropbox' | 'aws-s3';

export interface CloudProviderInfo {
  type: CloudProviderType;
  name: string;
  isConfigured: boolean;
  isAuthenticated?: boolean;
  accountInfo?: {
    name: string;
    email?: string;
    id: string;
  };
  storageInfo?: {
    used: number;
    available: number;
    total: number;
  };
}

export class CloudManager {
  private providers: Map<CloudProviderType, any> = new Map();
  private configs: CloudConfig = {};

  constructor(configs: CloudConfig = {}) {
    this.configs = configs;
    this.initializeProviders();
  }

  /**
   * Initialize cloud providers based on configuration
   */
  private initializeProviders() {
    // Initialize Google Drive
    if (this.configs.googleDrive) {
      try {
        const provider = new GoogleDriveProvider(this.configs.googleDrive);
        this.providers.set('google-drive', provider);
      } catch (error) {
        console.error('Error initializing Google Drive provider:', error);
      }
    }

    // Initialize Dropbox
    if (this.configs.dropbox) {
      try {
        const provider = new DropboxProvider(this.configs.dropbox);
        this.providers.set('dropbox', provider);
      } catch (error) {
        console.error('Error initializing Dropbox provider:', error);
      }
    }

    // Initialize AWS S3
    if (this.configs.awsS3) {
      try {
        const provider = new AWSS3Provider(this.configs.awsS3);
        this.providers.set('aws-s3', provider);
      } catch (error) {
        console.error('Error initializing AWS S3 provider:', error);
      }
    }
  }

  /**
   * Get list of available providers
   */
  async getProviders(): Promise<CloudProviderInfo[]> {
    const providerInfos: CloudProviderInfo[] = [];

    for (const [type, provider] of this.providers) {
      try {
        let isAuthenticated = false;
        let accountInfo: any = undefined;
        let storageInfo: any = undefined;

        // Check authentication status
        if (type === 'google-drive') {
          isAuthenticated = provider.isAuthenticated();
          if (isAuthenticated) {
            try {
              storageInfo = await provider.getStorageInfo();
            } catch (error) {
              console.warn('Could not get Google Drive storage info:', error);
            }
          }
        } else if (type === 'dropbox') {
          isAuthenticated = provider.isAuthenticated();
          if (isAuthenticated) {
            try {
              accountInfo = await provider.getAccountInfo();
              storageInfo = await provider.getStorageInfo();
            } catch (error) {
              console.warn('Could not get Dropbox account/storage info:', error);
            }
          }
        } else if (type === 'aws-s3') {
          isAuthenticated = provider.isConfigured();
          if (isAuthenticated) {
            try {
              const connected = await provider.testConnection();
              isAuthenticated = connected;
              if (connected) {
                const bucketInfo = await provider.getBucketInfo();
                accountInfo = { name: bucketInfo.name, id: bucketInfo.name };
                const stats = await provider.getStorageStats();
                storageInfo = {
                  used: stats.totalSize,
                  available: -1, // S3 doesn't have a fixed limit
                  total: -1
                };
              }
            } catch (error) {
              console.warn('Could not verify S3 connection:', error);
              isAuthenticated = false;
            }
          }
        }

        const info: CloudProviderInfo = {
          type,
          name: this.getProviderName(type),
          isConfigured: true,
          isAuthenticated,
          accountInfo,
          storageInfo: storageInfo ? {
            used: storageInfo.used || storageInfo.usage || 0,
            available: storageInfo.available || (storageInfo.limit - storageInfo.usage) || -1,
            total: storageInfo.total || storageInfo.limit || storageInfo.allocated || -1
          } : undefined
        };

        providerInfos.push(info);
      } catch (error) {
        console.error(`Error getting info for provider ${type}:`, error);
        providerInfos.push({
          type,
          name: this.getProviderName(type),
          isConfigured: false,
          isAuthenticated: false
        });
      }
    }

    // Add unconfigured providers
    const configuredTypes = new Set(this.providers.keys());
    const allTypes: CloudProviderType[] = ['google-drive', 'dropbox', 'aws-s3'];
    
    for (const type of allTypes) {
      if (!configuredTypes.has(type)) {
        providerInfos.push({
          type,
          name: this.getProviderName(type),
          isConfigured: false,
          isAuthenticated: false
        });
      }
    }

    return providerInfos;
  }

  /**
   * List files from a specific cloud provider
   */
  async listFiles(
    providerType: CloudProviderType,
    path?: string,
    onProgress?: (processed: number, total: number, current: string) => void
  ): Promise<MediaFile[]> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    try {
      return await provider.listMediaFiles(path, onProgress);
    } catch (error) {
      console.error(`Error listing files from ${providerType}:`, error);
      throw error;
    }
  }

  /**
   * Search files across all configured providers
   */
  async searchFiles(query: string): Promise<{ [key in CloudProviderType]?: MediaFile[] }> {
    const results: { [key in CloudProviderType]?: MediaFile[] } = {};

    const searchPromises = Array.from(this.providers.entries()).map(async ([type, provider]) => {
      try {
        const files = await provider.searchFiles(query);
        results[type] = files;
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
        results[type] = [];
      }
    });

    await Promise.all(searchPromises);
    return results;
  }

  /**
   * Download file from cloud provider
   */
  async downloadFile(providerType: CloudProviderType, filePath: string): Promise<Buffer> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    try {
      return await provider.downloadFile(filePath);
    } catch (error) {
      console.error(`Error downloading file from ${providerType}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata from cloud provider
   */
  async getFileMetadata(providerType: CloudProviderType, filePath: string): Promise<any> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    try {
      return await provider.getFileMetadata(filePath);
    } catch (error) {
      console.error(`Error getting metadata from ${providerType}:`, error);
      throw error;
    }
  }

  /**
   * Get authorization URL for OAuth providers
   */
  getAuthUrl(providerType: CloudProviderType): string {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    if (providerType === 'google-drive' && provider.getAuthUrl) {
      return provider.getAuthUrl();
    }

    throw new Error(`Provider ${providerType} does not support OAuth`);
  }

  /**
   * Handle OAuth callback
   */
  async handleAuthCallback(providerType: CloudProviderType, code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    if (providerType === 'google-drive' && provider.getTokens) {
      return await provider.getTokens(code);
    }

    throw new Error(`Provider ${providerType} does not support OAuth`);
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(providerType: CloudProviderType, config: any) {
    if (providerType === 'google-drive') {
      this.configs.googleDrive = config as GoogleDriveConfig;
    } else if (providerType === 'dropbox') {
      this.configs.dropbox = config as DropboxConfig;
    } else if (providerType === 'aws-s3') {
      this.configs.awsS3 = config as AWSS3Config;
    }

    // Reinitialize the specific provider
    this.initializeProviders();
  }

  /**
   * Remove provider configuration
   */
  removeProviderConfig(providerType: CloudProviderType) {
    if (providerType === 'google-drive') {
      delete this.configs.googleDrive;
    } else if (providerType === 'dropbox') {
      delete this.configs.dropbox;
    } else if (providerType === 'aws-s3') {
      delete this.configs.awsS3;
    }

    this.providers.delete(providerType);
  }

  /**
   * Get folders/directories from provider
   */
  async getFolders(providerType: CloudProviderType, parentPath?: string): Promise<Array<{ id?: string; name: string; path: string }>> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    try {
      const folders = await provider.getFolders(parentPath);
      
      // Normalize folder structure across providers
      return folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        path: folder.path || folder.prefix || folder.id
      }));
    } catch (error) {
      console.error(`Error getting folders from ${providerType}:`, error);
      throw error;
    }
  }

  /**
   * Get provider display name
   */
  private getProviderName(type: CloudProviderType): string {
    const names = {
      'google-drive': 'Google Drive',
      'dropbox': 'Dropbox',
      'aws-s3': 'AWS S3'
    };
    return names[type];
  }

  /**
   * Test all configured providers
   */
  async testAllProviders(): Promise<{ [key in CloudProviderType]?: boolean }> {
    const results: { [key in CloudProviderType]?: boolean } = {};

    const testPromises = Array.from(this.providers.entries()).map(async ([type, provider]) => {
      try {
        if (type === 'aws-s3' && provider.testConnection) {
          results[type] = await provider.testConnection();
        } else if (type === 'google-drive' && provider.isAuthenticated) {
          results[type] = provider.isAuthenticated();
        } else if (type === 'dropbox' && provider.isAuthenticated) {
          results[type] = provider.isAuthenticated();
        } else {
          results[type] = true; // Assume working if no specific test method
        }
      } catch (error) {
        console.error(`Error testing ${type}:`, error);
        results[type] = false;
      }
    });

    await Promise.all(testPromises);
    return results;
  }

  /**
   * Get current configuration
   */
  getConfig(): CloudConfig {
    return { ...this.configs };
  }

  /**
   * Check if any providers are configured
   */
  hasConfiguredProviders(): boolean {
    return this.providers.size > 0;
  }
}