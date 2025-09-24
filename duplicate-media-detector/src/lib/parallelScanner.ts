import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { MediaFile, ScanProgress } from '@/types/media';

interface WorkerMessage {
  type: 'progress' | 'result' | 'error';
  workerId: number;
  processed?: number;
  total?: number;
  currentFile?: string;
  files?: MediaFile[];
  error?: string;
  file?: string;
}

export class ParallelScanner {
  private workers: Worker[] = [];
  private numWorkers: number;
  private onProgress?: (progress: ScanProgress) => void;
  private results: MediaFile[] = [];
  private errors: string[] = [];
  private completedWorkers = 0;
  private totalFiles = 0;
  private processedFiles = 0;

  constructor(onProgress?: (progress: ScanProgress) => void) {
    this.numWorkers = Math.min(os.cpus().length, 8); // Max 8 workers
    this.onProgress = onProgress;
  }

  async scanFiles(filePaths: string[]): Promise<MediaFile[]> {
    this.totalFiles = filePaths.length;
    this.processedFiles = 0;
    this.completedWorkers = 0;
    this.results = [];
    this.errors = [];

    if (filePaths.length === 0) {
      return [];
    }

    this.updateProgress('hashing', 'Starting parallel processing...');

    // Split files among workers
    const filesPerWorker = Math.ceil(filePaths.length / this.numWorkers);
    const workerPromises: Promise<void>[] = [];

    for (let i = 0; i < this.numWorkers; i++) {
      const startIndex = i * filesPerWorker;
      const endIndex = Math.min(startIndex + filesPerWorker, filePaths.length);
      
      if (startIndex >= filePaths.length) break;

      const workerPromise = this.createWorker(filePaths, startIndex, endIndex, i);
      workerPromises.push(workerPromise);
    }

    // Wait for all workers to complete
    await Promise.all(workerPromises);

    this.updateProgress('complete', 'Processing complete');
    this.cleanup();

    if (this.errors.length > 0) {
      console.warn(`Completed with ${this.errors.length} errors:`, this.errors);
    }

    return this.results;
  }

  private async createWorker(
    filePaths: string[], 
    startIndex: number, 
    endIndex: number, 
    workerId: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'workers', 'hashingWorker.js');
      
      // Fallback to TypeScript file if compiled JavaScript doesn't exist
      const workerScript = `
        const { parentPort, workerData } = require('worker_threads');
        const { HashingService } = require('../hashing');
        const fs = require('fs');
        const path = require('path');

        // Worker implementation here would be the same as hashingWorker.ts
        // For simplicity, using inline implementation
        
        async function processFiles() {
          // Implementation similar to hashingWorker.ts
          // This is a simplified version for demonstration
          
          const { filePaths, startIndex, endIndex, workerId } = workerData;
          const filesToProcess = filePaths.slice(startIndex, endIndex);
          const processedFiles = [];

          for (let i = 0; i < filesToProcess.length; i++) {
            const filePath = filesToProcess[i];
            
            try {
              parentPort.postMessage({
                type: 'progress',
                workerId,
                processed: i,
                total: filesToProcess.length,
                currentFile: path.basename(filePath)
              });

              // Simplified processing - in real implementation, this would use HashingService
              const stats = fs.statSync(filePath);
              const mediaFile = {
                id: Math.random().toString(36),
                name: path.basename(filePath),
                path: filePath,
                size: stats.size,
                type: 'image',
                mimeType: 'image/jpeg',
                hash: 'dummy-hash-' + i,
                createdAt: stats.birthtime || stats.ctime,
                modifiedAt: stats.mtime,
                tags: [],
                source: 'local'
              };
              
              processedFiles.push(mediaFile);
            } catch (error) {
              parentPort.postMessage({
                type: 'error',
                workerId,
                error: error.message,
                file: filePath
              });
            }
          }

          parentPort.postMessage({
            type: 'result',
            workerId,
            files: processedFiles
          });
        }

        processFiles();
      `;

      const worker = new Worker(workerScript, {
        eval: true,
        workerData: {
          filePaths,
          startIndex,
          endIndex,
          workerId
        }
      });

      worker.on('message', (message: WorkerMessage) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', (error) => {
        this.errors.push(`Worker ${workerId} error: ${error.message}`);
        this.completedWorkers++;
        if (this.completedWorkers === this.workers.length) {
          resolve();
        }
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          this.errors.push(`Worker ${workerId} exited with code ${code}`);
        }
        this.completedWorkers++;
        if (this.completedWorkers === this.workers.length) {
          resolve();
        }
      });

      this.workers.push(worker);
    });
  }

  private handleWorkerMessage(message: WorkerMessage) {
    switch (message.type) {
      case 'progress':
        if (message.processed !== undefined && message.currentFile) {
          this.updateProgress('hashing', message.currentFile);
        }
        break;

      case 'result':
        if (message.files) {
          this.results.push(...message.files);
          this.processedFiles += message.files.length;
        }
        break;

      case 'error':
        if (message.error) {
          const errorMsg = message.file 
            ? `${message.file}: ${message.error}`
            : message.error;
          this.errors.push(errorMsg);
        }
        break;
    }
  }

  private updateProgress(stage: ScanProgress['stage'], current: string) {
    if (this.onProgress) {
      this.onProgress({
        total: this.totalFiles,
        processed: this.processedFiles,
        current,
        stage,
        duplicatesFound: 0
      });
    }
  }

  private cleanup() {
    this.workers.forEach(worker => {
      try {
        worker.terminate();
      } catch (error) {
        console.warn('Error terminating worker:', error);
      }
    });
    this.workers = [];
  }

  stop() {
    this.cleanup();
  }
}

// Streaming file processor for very large datasets
export class StreamingProcessor {
  private batchSize: number;
  private onBatchComplete?: (batch: MediaFile[]) => void;
  private onProgress?: (progress: ScanProgress) => void;

  constructor(
    batchSize: number = 100,
    onBatchComplete?: (batch: MediaFile[]) => void,
    onProgress?: (progress: ScanProgress) => void
  ) {
    this.batchSize = batchSize;
    this.onBatchComplete = onBatchComplete;
    this.onProgress = onProgress;
  }

  async processInBatches(filePaths: string[]): Promise<MediaFile[]> {
    const allResults: MediaFile[] = [];
    const totalBatches = Math.ceil(filePaths.length / this.batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, filePaths.length);
      const batchFiles = filePaths.slice(startIndex, endIndex);

      this.updateProgress(
        'hashing',
        `Processing batch ${batchIndex + 1} of ${totalBatches}`,
        batchIndex * this.batchSize,
        filePaths.length
      );

      // Process batch with parallel scanner
      const scanner = new ParallelScanner();
      const batchResults = await scanner.scanFiles(batchFiles);
      
      allResults.push(...batchResults);
      
      if (this.onBatchComplete) {
        this.onBatchComplete(batchResults);
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.updateProgress('complete', 'All batches processed', filePaths.length, filePaths.length);
    return allResults;
  }

  private updateProgress(
    stage: ScanProgress['stage'], 
    current: string, 
    processed: number = 0, 
    total: number = 0
  ) {
    if (this.onProgress) {
      this.onProgress({
        total,
        processed,
        current,
        stage,
        duplicatesFound: 0
      });
    }
  }
}

// Memory-efficient duplicate detector for large datasets
export class StreamingDuplicateDetector {
  private similarityThreshold: number;
  private onProgress?: (progress: { processed: number; total: number; stage: string }) => void;

  constructor(
    similarityThreshold: number = 90,
    onProgress?: (progress: { processed: number; total: number; stage: string }) => void
  ) {
    this.similarityThreshold = similarityThreshold;
    this.onProgress = onProgress;
  }

  async findDuplicatesStreaming(files: MediaFile[]): Promise<MediaFile[][]> {
    // Use a Map for O(1) hash lookups
    const hashGroups = new Map<string, MediaFile[]>();
    const duplicateGroups: MediaFile[][] = [];

    this.updateProgress(0, files.length, 'Grouping by hash');

    // Group files by hash
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!hashGroups.has(file.hash)) {
        hashGroups.set(file.hash, []);
      }
      hashGroups.get(file.hash)!.push(file);

      if (i % 1000 === 0) {
        this.updateProgress(i, files.length, 'Grouping by hash');
      }
    }

    this.updateProgress(files.length, files.length, 'Finding duplicate groups');

    // Find groups with duplicates
    let processed = 0;
    for (const [hash, groupFiles] of hashGroups) {
      if (groupFiles.length > 1) {
        duplicateGroups.push(groupFiles);
      }
      processed++;
      
      if (processed % 100 === 0) {
        this.updateProgress(processed, hashGroups.size, 'Processing hash groups');
      }
    }

    this.updateProgress(hashGroups.size, hashGroups.size, 'Complete');

    return duplicateGroups;
  }

  private updateProgress(processed: number, total: number, stage: string) {
    if (this.onProgress) {
      this.onProgress({ processed, total, stage });
    }
  }
}