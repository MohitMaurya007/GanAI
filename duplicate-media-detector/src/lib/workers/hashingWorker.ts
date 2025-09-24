import { parentPort, workerData } from 'worker_threads';
import { HashingService } from '../hashing';
import { MediaFile } from '@/types/media';
import fs from 'fs';
import path from 'path';

interface WorkerData {
  filePaths: string[];
  startIndex: number;
  endIndex: number;
  workerId: number;
}

interface ProgressMessage {
  type: 'progress';
  workerId: number;
  processed: number;
  total: number;
  currentFile: string;
}

interface ResultMessage {
  type: 'result';
  workerId: number;
  files: MediaFile[];
}

interface ErrorMessage {
  type: 'error';
  workerId: number;
  error: string;
  file?: string;
}

async function processFiles() {
  if (!parentPort) {
    console.error('Worker: parentPort is not available');
    return;
  }

  const { filePaths, startIndex, endIndex, workerId } = workerData as WorkerData;
  const filesToProcess = filePaths.slice(startIndex, endIndex);
  const processedFiles: MediaFile[] = [];

  try {
    for (let i = 0; i < filesToProcess.length; i++) {
      const filePath = filesToProcess[i];
      
      try {
        // Send progress update
        const progressMessage: ProgressMessage = {
          type: 'progress',
          workerId,
          processed: i,
          total: filesToProcess.length,
          currentFile: path.basename(filePath)
        };
        parentPort.postMessage(progressMessage);

        // Check if file exists and is accessible
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          continue;
        }

        // Generate hashes
        const hashes = await HashingService.generateAllHashes(filePath);
        
        // Get file metadata
        const extension = path.extname(filePath).toLowerCase();
        const mimeType = getMimeType(extension);
        
        // Get image dimensions if it's an image
        let dimensions: { width: number; height: number } | undefined;
        if (mimeType.startsWith('image/')) {
          try {
            dimensions = await getImageDimensions(filePath);
          } catch (error) {
            console.warn(`Could not get dimensions for ${filePath}:`, error);
          }
        }

        const mediaFile: MediaFile = {
          id: generateId(),
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          type: getFileType(mimeType),
          mimeType,
          hash: hashes.md5,
          perceptualHash: hashes.perceptual,
          createdAt: stats.birthtime || stats.ctime,
          modifiedAt: stats.mtime,
          dimensions,
          metadata: undefined, // Will be populated later if needed
          tags: [],
          source: 'local'
        };

        processedFiles.push(mediaFile);

      } catch (error) {
        const errorMessage: ErrorMessage = {
          type: 'error',
          workerId,
          error: error instanceof Error ? error.message : 'Unknown error',
          file: filePath
        };
        parentPort.postMessage(errorMessage);
      }
    }

    // Send final results
    const resultMessage: ResultMessage = {
      type: 'result',
      workerId,
      files: processedFiles
    };
    parentPort.postMessage(resultMessage);

  } catch (error) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      workerId,
      error: error instanceof Error ? error.message : 'Worker failed'
    };
    parentPort.postMessage(errorMessage);
  }
}

function getMimeType(extension: string): string {
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

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}

async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
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
    // Fallback to jimp if sharp fails
    try {
      const Jimp = require('jimp');
      const image = await Jimp.read(filePath);
      return {
        width: image.getWidth(),
        height: image.getHeight()
      };
    } catch (jimpError) {
      throw error; // Throw original sharp error
    }
  }
  
  return undefined;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Start processing
processFiles().catch(error => {
  if (parentPort) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      workerId: workerData?.workerId || 0,
      error: error instanceof Error ? error.message : 'Worker initialization failed'
    };
    parentPort.postMessage(errorMessage);
  }
});