import sharp from 'sharp';
import Jimp from 'jimp';
import { MediaFile } from '@/types/media';

export interface SimilarityResult {
  similarity: number;
  method: 'dhash' | 'ahash' | 'phash' | 'ssim' | 'histogram' | 'feature-matching';
  confidence: number;
}

export class AdvancedSimilarityDetector {
  private similarityThreshold: number;

  constructor(similarityThreshold: number = 85) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Compare two images using multiple similarity algorithms
   */
  async compareImages(file1: MediaFile, file2: MediaFile): Promise<SimilarityResult[]> {
    const results: SimilarityResult[] = [];

    try {
      // Load images
      const [image1, image2] = await Promise.all([
        this.loadImage(file1.path),
        this.loadImage(file2.path)
      ]);

      // Run multiple similarity checks
      const [
        dhashResult,
        ahashResult,
        phashResult,
        histogramResult,
        ssimResult
      ] = await Promise.all([
        this.compareDHash(image1, image2),
        this.compareAHash(image1, image2),
        this.comparePHash(image1, image2),
        this.compareHistogram(image1, image2),
        this.compareSSIM(image1, image2)
      ]);

      results.push(dhashResult, ahashResult, phashResult, histogramResult, ssimResult);

      return results;
    } catch (error) {
      console.error('Error comparing images:', error);
      return [];
    }
  }

  /**
   * Get overall similarity score from multiple methods
   */
  getOverallSimilarity(results: SimilarityResult[]): number {
    if (results.length === 0) return 0;

    // Weighted average based on confidence
    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = result.confidence;
      totalScore += result.similarity * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Load image using Sharp for better performance
   */
  private async loadImage(imagePath: string): Promise<sharp.Sharp> {
    return sharp(imagePath);
  }

  /**
   * Compare using Difference Hash (dHash)
   */
  private async compareDHash(image1: sharp.Sharp, image2: sharp.Sharp): Promise<SimilarityResult> {
    try {
      const [hash1, hash2] = await Promise.all([
        this.generateDHash(image1),
        this.generateDHash(image2)
      ]);

      const similarity = this.calculateHammingDistance(hash1, hash2);
      
      return {
        similarity,
        method: 'dhash',
        confidence: 0.8 // dHash is quite reliable for similar images
      };
    } catch (error) {
      return { similarity: 0, method: 'dhash', confidence: 0 };
    }
  }

  /**
   * Compare using Average Hash (aHash)
   */
  private async compareAHash(image1: sharp.Sharp, image2: sharp.Sharp): Promise<SimilarityResult> {
    try {
      const [hash1, hash2] = await Promise.all([
        this.generateAHash(image1),
        this.generateAHash(image2)
      ]);

      const similarity = this.calculateHammingDistance(hash1, hash2);
      
      return {
        similarity,
        method: 'ahash',
        confidence: 0.7 // aHash is less reliable than dHash
      };
    } catch (error) {
      return { similarity: 0, method: 'ahash', confidence: 0 };
    }
  }

  /**
   * Compare using Perceptual Hash (pHash) - more sophisticated
   */
  private async comparePHash(image1: sharp.Sharp, image2: sharp.Sharp): Promise<SimilarityResult> {
    try {
      const [hash1, hash2] = await Promise.all([
        this.generatePHash(image1),
        this.generatePHash(image2)
      ]);

      const similarity = this.calculateHammingDistance(hash1, hash2);
      
      return {
        similarity,
        method: 'phash',
        confidence: 0.9 // pHash is the most reliable for perceptual similarity
      };
    } catch (error) {
      return { similarity: 0, method: 'phash', confidence: 0 };
    }
  }

  /**
   * Compare using histogram analysis
   */
  private async compareHistogram(image1: sharp.Sharp, image2: sharp.Sharp): Promise<SimilarityResult> {
    try {
      const [hist1, hist2] = await Promise.all([
        this.generateHistogram(image1),
        this.generateHistogram(image2)
      ]);

      const similarity = this.compareHistograms(hist1, hist2);
      
      return {
        similarity,
        method: 'histogram',
        confidence: 0.6 // Histograms are good for color similarity but not structure
      };
    } catch (error) {
      return { similarity: 0, method: 'histogram', confidence: 0 };
    }
  }

  /**
   * Compare using Structural Similarity Index (SSIM)
   */
  private async compareSSIM(image1: sharp.Sharp, image2: sharp.Sharp): Promise<SimilarityResult> {
    try {
      // Resize images to same dimensions for SSIM comparison
      const [resized1, resized2] = await Promise.all([
        image1.clone().resize(256, 256).greyscale().raw().toBuffer(),
        image2.clone().resize(256, 256).greyscale().raw().toBuffer()
      ]);

      const ssim = this.calculateSSIM(resized1, resized2, 256, 256);
      const similarity = Math.round(ssim * 100);
      
      return {
        similarity,
        method: 'ssim',
        confidence: 0.85 // SSIM is very good for structural similarity
      };
    } catch (error) {
      return { similarity: 0, method: 'ssim', confidence: 0 };
    }
  }

  /**
   * Generate Difference Hash
   */
  private async generateDHash(image: sharp.Sharp): Promise<string> {
    const { data } = await image
      .clone()
      .resize(9, 8)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let hash = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const current = data[y * 9 + x];
        const next = data[y * 9 + x + 1];
        hash += current > next ? '1' : '0';
      }
    }

    return this.binaryToHex(hash);
  }

  /**
   * Generate Average Hash
   */
  private async generateAHash(image: sharp.Sharp): Promise<string> {
    const { data } = await image
      .clone()
      .resize(8, 8)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const average = data.reduce((sum, pixel) => sum + pixel, 0) / data.length;

    let hash = '';
    for (const pixel of data) {
      hash += pixel > average ? '1' : '0';
    }

    return this.binaryToHex(hash);
  }

  /**
   * Generate Perceptual Hash (DCT-based)
   */
  private async generatePHash(image: sharp.Sharp): Promise<string> {
    // Resize to 32x32 for DCT
    const { data } = await image
      .clone()
      .resize(32, 32)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Apply DCT (simplified version)
    const dct = this.applyDCT(data, 32, 32);
    
    // Take top-left 8x8 of DCT (excluding DC component)
    const lowFreq = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (x !== 0 || y !== 0) { // Skip DC component
          lowFreq.push(dct[y * 32 + x]);
        }
      }
    }

    // Calculate median
    const sorted = [...lowFreq].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Generate hash based on median
    let hash = '';
    for (const value of lowFreq) {
      hash += value > median ? '1' : '0';
    }

    return this.binaryToHex(hash);
  }

  /**
   * Generate color histogram
   */
  private async generateHistogram(image: sharp.Sharp): Promise<number[]> {
    const { data } = await image
      .clone()
      .resize(256, 256)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const histogram = new Array(256).fill(0);
    
    // For RGB images, we'll use luminance
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[luminance]++;
    }

    // Normalize
    const total = histogram.reduce((sum, count) => sum + count, 0);
    return histogram.map(count => count / total);
  }

  /**
   * Compare two histograms using correlation
   */
  private compareHistograms(hist1: number[], hist2: number[]): number {
    if (hist1.length !== hist2.length) return 0;

    let correlation = 0;
    const mean1 = hist1.reduce((sum, val) => sum + val, 0) / hist1.length;
    const mean2 = hist2.reduce((sum, val) => sum + val, 0) / hist2.length;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < hist1.length; i++) {
      const diff1 = hist1[i] - mean1;
      const diff2 = hist2[i] - mean2;
      
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denom1 * denom2);
    correlation = denominator > 0 ? numerator / denominator : 0;

    return Math.round(Math.max(0, correlation) * 100);
  }

  /**
   * Calculate SSIM between two images
   */
  private calculateSSIM(img1: Buffer, img2: Buffer, width: number, height: number): number {
    if (img1.length !== img2.length) return 0;

    const c1 = 0.01 * 0.01;
    const c2 = 0.03 * 0.03;

    let mu1 = 0, mu2 = 0;
    const n = img1.length;

    // Calculate means
    for (let i = 0; i < n; i++) {
      mu1 += img1[i];
      mu2 += img2[i];
    }
    mu1 /= n;
    mu2 /= n;

    // Calculate variances and covariance
    let sigma1 = 0, sigma2 = 0, sigma12 = 0;
    for (let i = 0; i < n; i++) {
      const diff1 = img1[i] - mu1;
      const diff2 = img2[i] - mu2;
      
      sigma1 += diff1 * diff1;
      sigma2 += diff2 * diff2;
      sigma12 += diff1 * diff2;
    }
    sigma1 /= n - 1;
    sigma2 /= n - 1;
    sigma12 /= n - 1;

    // Calculate SSIM
    const numerator = (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2);
    const denominator = (mu1 * mu1 + mu2 * mu2 + c1) * (sigma1 + sigma2 + c2);

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Apply Discrete Cosine Transform (simplified)
   */
  private applyDCT(data: Buffer, width: number, height: number): number[] {
    const result = new Array(width * height).fill(0);
    
    for (let u = 0; u < height; u++) {
      for (let v = 0; v < width; v++) {
        let sum = 0;
        
        for (let x = 0; x < height; x++) {
          for (let y = 0; y < width; y++) {
            const pixel = data[x * width + y];
            const cos1 = Math.cos((2 * x + 1) * u * Math.PI / (2 * height));
            const cos2 = Math.cos((2 * y + 1) * v * Math.PI / (2 * width));
            sum += pixel * cos1 * cos2;
          }
        }
        
        const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
        const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
        
        result[u * width + v] = (cu * cv / 4) * sum;
      }
    }
    
    return result;
  }

  /**
   * Calculate Hamming distance and convert to similarity percentage
   */
  private calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;
    
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }
    
    const maxDistance = hash1.length;
    return Math.round((1 - distance / maxDistance) * 100);
  }

  /**
   * Convert binary string to hexadecimal
   */
  private binaryToHex(binary: string): string {
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.substr(i, 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  }

  /**
   * Find similar images in a collection using advanced methods
   */
  async findSimilarImages(files: MediaFile[]): Promise<Array<{
    files: MediaFile[];
    similarity: number;
    methods: SimilarityResult[];
  }>> {
    const similarGroups: Array<{
      files: MediaFile[];
      similarity: number;
      methods: SimilarityResult[];
    }> = [];

    const imageFiles = files.filter(file => file.type === 'image');
    const processed = new Set<string>();

    for (let i = 0; i < imageFiles.length; i++) {
      if (processed.has(imageFiles[i].id)) continue;

      const currentFile = imageFiles[i];
      const similarFiles = [currentFile];
      processed.add(currentFile.id);

      for (let j = i + 1; j < imageFiles.length; j++) {
        if (processed.has(imageFiles[j].id)) continue;

        const compareFile = imageFiles[j];
        const results = await this.compareImages(currentFile, compareFile);
        const overallSimilarity = this.getOverallSimilarity(results);

        if (overallSimilarity >= this.similarityThreshold) {
          similarFiles.push(compareFile);
          processed.add(compareFile.id);
        }
      }

      if (similarFiles.length > 1) {
        // Calculate average similarity for the group
        let totalSimilarity = 0;
        let comparisons = 0;
        const allMethods: SimilarityResult[] = [];

        for (let x = 0; x < similarFiles.length - 1; x++) {
          for (let y = x + 1; y < similarFiles.length; y++) {
            const results = await this.compareImages(similarFiles[x], similarFiles[y]);
            const similarity = this.getOverallSimilarity(results);
            totalSimilarity += similarity;
            comparisons++;
            allMethods.push(...results);
          }
        }

        const avgSimilarity = comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;

        similarGroups.push({
          files: similarFiles,
          similarity: avgSimilarity,
          methods: allMethods
        });
      }
    }

    return similarGroups;
  }
}