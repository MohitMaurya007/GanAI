import crypto from 'crypto';
import fs from 'fs';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import sharp from 'sharp';
import Jimp from 'jimp';

const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

export class HashingService {
  /**
   * Generate MD5 hash of a file
   */
  static async generateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate SHA-256 hash of a file (more secure alternative)
   */
  static async generateSecureHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate perceptual hash for images using difference hash (dHash)
   */
  static async generatePerceptualHash(filePath: string): Promise<string> {
    try {
      // Use Jimp for cross-platform compatibility
      const image = await Jimp.read(filePath);
      
      // Resize to 9x8 (we need 8x8 for comparison, but 9x8 for difference calculation)
      image.resize(9, 8);
      image.greyscale();
      
      // Calculate difference hash
      let hash = '';
      const pixels = [];
      
      // Get pixel values
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
          const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
          pixels.push(pixel.r); // Since it's greyscale, r=g=b
        }
      }
      
      // Compare adjacent pixels
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const current = pixels[y * 9 + x];
          const next = pixels[y * 9 + x + 1];
          hash += current > next ? '1' : '0';
        }
      }
      
      // Convert binary to hex
      return this.binaryToHex(hash);
    } catch (error) {
      console.error('Error generating perceptual hash:', error);
      throw error;
    }
  }

  /**
   * Alternative perceptual hash using average hash (aHash)
   */
  static async generateAverageHash(filePath: string): Promise<string> {
    try {
      const image = await Jimp.read(filePath);
      
      // Resize to 8x8 and convert to greyscale
      image.resize(8, 8);
      image.greyscale();
      
      // Calculate average pixel value
      let total = 0;
      const pixels = [];
      
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
          pixels.push(pixel.r);
          total += pixel.r;
        }
      }
      
      const average = total / 64;
      
      // Generate hash based on whether each pixel is above or below average
      let hash = '';
      for (const pixel of pixels) {
        hash += pixel > average ? '1' : '0';
      }
      
      return this.binaryToHex(hash);
    } catch (error) {
      console.error('Error generating average hash:', error);
      throw error;
    }
  }

  /**
   * Calculate Hamming distance between two hashes (for perceptual similarity)
   */
  static calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      throw new Error('Hashes must be of equal length');
    }
    
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }
    
    return distance;
  }

  /**
   * Calculate similarity percentage between two perceptual hashes
   */
  static calculateSimilarity(hash1: string, hash2: string): number {
    const distance = this.calculateHammingDistance(hash1, hash2);
    const maxDistance = hash1.length;
    return Math.round((1 - distance / maxDistance) * 100);
  }

  /**
   * Check if two perceptual hashes are similar (default threshold: 90%)
   */
  static areSimilar(hash1: string, hash2: string, threshold: number = 90): boolean {
    return this.calculateSimilarity(hash1, hash2) >= threshold;
  }

  /**
   * Convert binary string to hexadecimal
   */
  private static binaryToHex(binary: string): string {
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.substr(i, 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    return hex;
  }

  /**
   * Convert hexadecimal to binary string
   */
  private static hexToBinary(hex: string): string {
    let binary = '';
    for (const char of hex) {
      binary += parseInt(char, 16).toString(2).padStart(4, '0');
    }
    return binary;
  }

  /**
   * Generate multiple hash types for comprehensive comparison
   */
  static async generateAllHashes(filePath: string): Promise<{
    md5: string;
    sha256: string;
    perceptual?: string;
    average?: string;
  }> {
    const results: any = {};
    
    // Generate file hashes
    const [md5, sha256] = await Promise.all([
      this.generateFileHash(filePath),
      this.generateSecureHash(filePath)
    ]);
    
    results.md5 = md5;
    results.sha256 = sha256;
    
    // Generate perceptual hashes for images
    try {
      const stats = await stat(filePath);
      if (stats.isFile()) {
        const mimeType = this.getMimeType(filePath);
        if (mimeType.startsWith('image/')) {
          const [perceptual, average] = await Promise.all([
            this.generatePerceptualHash(filePath),
            this.generateAverageHash(filePath)
          ]);
          
          results.perceptual = perceptual;
          results.average = average;
        }
      }
    } catch (error) {
      console.warn('Could not generate perceptual hashes:', error);
    }
    
    return results;
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      tiff: 'image/tiff',
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm'
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}