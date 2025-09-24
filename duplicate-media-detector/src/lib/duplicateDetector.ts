import { MediaFile, DuplicateGroup } from '@/types/media';
import { HashingService } from './hashing';
import { v4 as uuidv4 } from 'uuid';

export class DuplicateDetector {
  private similarityThreshold: number;
  private onProgress?: (progress: { processed: number; total: number; stage: string }) => void;

  constructor(
    similarityThreshold: number = 90,
    onProgress?: (progress: { processed: number; total: number; stage: string }) => void
  ) {
    this.similarityThreshold = similarityThreshold;
    this.onProgress = onProgress;
  }

  /**
   * Find all duplicate groups in a collection of media files
   */
  async findDuplicates(files: MediaFile[]): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedFiles = new Set<string>();

    this.updateProgress(0, files.length, 'Finding exact duplicates');

    // Find exact duplicates by file hash
    const exactDuplicates = this.findExactDuplicates(files);
    duplicateGroups.push(...exactDuplicates);

    // Mark files that are already in exact duplicate groups
    exactDuplicates.forEach(group => {
      group.files.forEach(file => processedFiles.add(file.id));
    });

    this.updateProgress(files.length * 0.3, files.length, 'Finding perceptual duplicates');

    // Find perceptual duplicates among remaining files
    const remainingFiles = files.filter(file => !processedFiles.has(file.id));
    const perceptualDuplicates = await this.findPerceptualDuplicates(remainingFiles);
    duplicateGroups.push(...perceptualDuplicates);

    this.updateProgress(files.length, files.length, 'Complete');

    return duplicateGroups.filter(group => group.files.length > 1);
  }

  /**
   * Find exact duplicates by comparing file hashes
   */
  private findExactDuplicates(files: MediaFile[]): DuplicateGroup[] {
    const hashGroups = new Map<string, MediaFile[]>();

    // Group files by hash
    files.forEach(file => {
      if (!hashGroups.has(file.hash)) {
        hashGroups.set(file.hash, []);
      }
      hashGroups.get(file.hash)!.push(file);
    });

    // Create duplicate groups for hashes with multiple files
    const duplicateGroups: DuplicateGroup[] = [];
    
    hashGroups.forEach((groupFiles, hash) => {
      if (groupFiles.length > 1) {
        const group: DuplicateGroup = {
          id: uuidv4(),
          files: groupFiles,
          type: 'exact',
          similarity: 100,
          primaryFile: this.selectPrimaryFile(groupFiles),
          createdAt: new Date(),
          verified: false
        };
        
        duplicateGroups.push(group);
      }
    });

    return duplicateGroups;
  }

  /**
   * Find perceptual duplicates by comparing perceptual hashes
   */
  private async findPerceptualDuplicates(files: MediaFile[]): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedFiles = new Set<string>();
    
    // Only process image files for perceptual comparison
    const imageFiles = files.filter(file => 
      file.type === 'image' && file.perceptualHash
    );

    for (let i = 0; i < imageFiles.length; i++) {
      if (processedFiles.has(imageFiles[i].id)) continue;

      const currentFile = imageFiles[i];
      const similarFiles = [currentFile];
      processedFiles.add(currentFile.id);

      // Compare with remaining files
      for (let j = i + 1; j < imageFiles.length; j++) {
        if (processedFiles.has(imageFiles[j].id)) continue;

        const compareFile = imageFiles[j];
        
        if (currentFile.perceptualHash && compareFile.perceptualHash) {
          const similarity = HashingService.calculateSimilarity(
            currentFile.perceptualHash,
            compareFile.perceptualHash
          );

          if (similarity >= this.similarityThreshold) {
            similarFiles.push(compareFile);
            processedFiles.add(compareFile.id);
          }
        }
      }

      // Create duplicate group if we found similar files
      if (similarFiles.length > 1) {
        const group: DuplicateGroup = {
          id: uuidv4(),
          files: similarFiles,
          type: 'perceptual',
          similarity: this.calculateGroupSimilarity(similarFiles),
          primaryFile: this.selectPrimaryFile(similarFiles),
          createdAt: new Date(),
          verified: false
        };

        duplicateGroups.push(group);
      }

      // Update progress
      this.updateProgress(
        Math.floor(files.length * 0.3) + i + 1,
        files.length,
        'Finding perceptual duplicates'
      );
    }

    return duplicateGroups;
  }

  /**
   * Find near-duplicates using advanced comparison techniques
   */
  async findNearDuplicates(files: MediaFile[]): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedFiles = new Set<string>();
    
    // Group files by similar characteristics
    const sizeGroups = this.groupBySimilarSize(files);
    const dimensionGroups = this.groupBySimilarDimensions(files);
    
    for (const sizeGroup of sizeGroups) {
      for (const dimensionGroup of dimensionGroups) {
        // Find intersection of size and dimension groups
        const candidates = sizeGroup.filter(file => dimensionGroup.includes(file));
        
        if (candidates.length > 1) {
          const nearDuplicates = await this.compareAdvanced(candidates);
          duplicateGroups.push(...nearDuplicates);
        }
      }
    }

    return duplicateGroups.filter(group => group.files.length > 1);
  }

  /**
   * Group files by similar size (within 10% difference)
   */
  private groupBySimilarSize(files: MediaFile[]): MediaFile[][] {
    const groups: MediaFile[][] = [];
    const processed = new Set<string>();

    files.forEach(file => {
      if (processed.has(file.id)) return;

      const similarFiles = files.filter(otherFile => {
        if (processed.has(otherFile.id) || file.id === otherFile.id) return false;
        
        const sizeDiff = Math.abs(file.size - otherFile.size) / Math.max(file.size, otherFile.size);
        return sizeDiff <= 0.1; // Within 10%
      });

      if (similarFiles.length > 0) {
        similarFiles.push(file);
        similarFiles.forEach(f => processed.add(f.id));
        groups.push(similarFiles);
      }
    });

    return groups;
  }

  /**
   * Group files by similar dimensions (within 5% difference)
   */
  private groupBySimilarDimensions(files: MediaFile[]): MediaFile[][] {
    const groups: MediaFile[][] = [];
    const processed = new Set<string>();

    const filesWithDimensions = files.filter(file => file.dimensions);

    filesWithDimensions.forEach(file => {
      if (processed.has(file.id) || !file.dimensions) return;

      const similarFiles = filesWithDimensions.filter(otherFile => {
        if (processed.has(otherFile.id) || file.id === otherFile.id || !otherFile.dimensions) return false;
        
        const widthDiff = Math.abs(file.dimensions!.width - otherFile.dimensions!.width) / 
                         Math.max(file.dimensions!.width, otherFile.dimensions!.width);
        const heightDiff = Math.abs(file.dimensions!.height - otherFile.dimensions!.height) / 
                          Math.max(file.dimensions!.height, otherFile.dimensions!.height);
        
        return widthDiff <= 0.05 && heightDiff <= 0.05; // Within 5%
      });

      if (similarFiles.length > 0) {
        similarFiles.push(file);
        similarFiles.forEach(f => processed.add(f.id));
        groups.push(similarFiles);
      }
    });

    return groups;
  }

  /**
   * Advanced comparison for near-duplicate detection
   */
  private async compareAdvanced(files: MediaFile[]): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    // This would implement more sophisticated comparison algorithms
    // For now, we'll use a simplified approach based on multiple factors
    
    // Compare files pairwise with multiple criteria
    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];
        
        const similarity = this.calculateMultiFactorSimilarity(file1, file2);
        
        if (similarity >= 85) { // Lower threshold for near-duplicates
          const group: DuplicateGroup = {
            id: uuidv4(),
            files: [file1, file2],
            type: 'near-duplicate',
            similarity,
            primaryFile: this.selectPrimaryFile([file1, file2]),
            createdAt: new Date(),
            verified: false
          };
          
          groups.push(group);
        }
      }
    }

    return groups;
  }

  /**
   * Calculate similarity based on multiple factors
   */
  private calculateMultiFactorSimilarity(file1: MediaFile, file2: MediaFile): number {
    let totalWeight = 0;
    let totalScore = 0;

    // Size similarity (weight: 20%)
    if (file1.size && file2.size) {
      const sizeDiff = Math.abs(file1.size - file2.size) / Math.max(file1.size, file2.size);
      const sizeScore = Math.max(0, (1 - sizeDiff) * 100);
      totalScore += sizeScore * 0.2;
      totalWeight += 0.2;
    }

    // Dimension similarity (weight: 30%)
    if (file1.dimensions && file2.dimensions) {
      const widthDiff = Math.abs(file1.dimensions.width - file2.dimensions.width) / 
                       Math.max(file1.dimensions.width, file2.dimensions.width);
      const heightDiff = Math.abs(file1.dimensions.height - file2.dimensions.height) / 
                        Math.max(file1.dimensions.height, file2.dimensions.height);
      const dimensionScore = Math.max(0, (1 - (widthDiff + heightDiff) / 2) * 100);
      totalScore += dimensionScore * 0.3;
      totalWeight += 0.3;
    }

    // Perceptual hash similarity (weight: 50%)
    if (file1.perceptualHash && file2.perceptualHash) {
      const perceptualScore = HashingService.calculateSimilarity(
        file1.perceptualHash,
        file2.perceptualHash
      );
      totalScore += perceptualScore * 0.5;
      totalWeight += 0.5;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate average similarity for a group of files
   */
  private calculateGroupSimilarity(files: MediaFile[]): number {
    if (files.length < 2) return 100;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];
        
        if (file1.perceptualHash && file2.perceptualHash) {
          totalSimilarity += HashingService.calculateSimilarity(
            file1.perceptualHash,
            file2.perceptualHash
          );
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;
  }

  /**
   * Select primary file from a group (highest quality/resolution, most recent, etc.)
   */
  private selectPrimaryFile(files: MediaFile[]): MediaFile {
    if (files.length === 1) return files[0];

    // Priority factors (in order):
    // 1. Largest file size (usually higher quality)
    // 2. Highest resolution (for images)
    // 3. Most recent modification date
    // 4. Shortest path (likely in a more organized location)

    let primaryFile = files[0];

    for (const file of files) {
      // Prefer larger files
      if (file.size > primaryFile.size) {
        primaryFile = file;
        continue;
      }

      // If sizes are similar, prefer higher resolution
      if (Math.abs(file.size - primaryFile.size) / Math.max(file.size, primaryFile.size) < 0.1) {
        if (file.dimensions && primaryFile.dimensions) {
          const filePixels = file.dimensions.width * file.dimensions.height;
          const primaryPixels = primaryFile.dimensions.width * primaryFile.dimensions.height;
          
          if (filePixels > primaryPixels) {
            primaryFile = file;
            continue;
          }
        }

        // If resolution is similar, prefer more recent
        if (file.modifiedAt > primaryFile.modifiedAt) {
          primaryFile = file;
        }
      }
    }

    return primaryFile;
  }

  /**
   * Update progress callback
   */
  private updateProgress(processed: number, total: number, stage: string) {
    if (this.onProgress) {
      this.onProgress({ processed, total, stage });
    }
  }

  /**
   * Set similarity threshold for perceptual matching
   */
  setSimilarityThreshold(threshold: number) {
    this.similarityThreshold = Math.max(0, Math.min(100, threshold));
  }

  /**
   * Get current similarity threshold
   */
  getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }
}