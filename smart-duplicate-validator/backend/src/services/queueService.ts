import Queue from 'bull';
import { redisClient } from '../utils/redis';
import { prisma } from '../utils/database';
import { ProcessingJobData } from '../types';

// Queue configurations
const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create queues
export const mediaProcessingQueue = new Queue('media-processing', queueOptions);
export const duplicateDetectionQueue = new Queue('duplicate-detection', queueOptions);
export const featureExtractionQueue = new Queue('feature-extraction', queueOptions);
export const cleanupQueue = new Queue('cleanup', queueOptions);

// Job processors
mediaProcessingQueue.process('process-media', async (job) => {
  const { mediaFileId, jobType, inputData } = job.data;
  
  try {
    console.log(`Processing media file: ${mediaFileId}`);
    
    // Update job status
    await prisma.processingJob.create({
      data: {
        mediaFileId,
        jobType,
        status: 'PROCESSING',
        inputData,
        queueName: 'media-processing',
        jobId: job.id.toString(),
        startedAt: new Date(),
      },
    });

    // Update media file status
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: { processingStatus: 'PROCESSING' },
    });

    // Emit progress update
    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'processing',
        progress: 0,
      });
    }

    // Add feature extraction job
    await featureExtractionQueue.add('extract-features', {
      mediaFileId,
      jobType: 'feature_extraction',
    }, {
      priority: 5,
    });

    return { success: true, mediaFileId };
  } catch (error) {
    console.error('Media processing failed:', error);
    
    // Update job status
    await prisma.processingJob.updateMany({
      where: { mediaFileId, jobType: 'process-media' },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    // Update media file status
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: { 
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Emit error update
    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    throw error;
  }
});

featureExtractionQueue.process('extract-features', async (job) => {
  const { mediaFileId } = job.data;
  
  try {
    console.log(`Extracting features for media file: ${mediaFileId}`);
    
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: mediaFileId },
      include: { features: true },
    });

    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    // Progress updates
    job.progress(10);
    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'extracting-features',
        progress: 10,
      });
    }

    // Call ML services based on media type
    let features: any = {};

    if (mediaFile.mediaType === 'IMAGE') {
      // Extract image features
      features = await extractImageFeatures(mediaFile.filePath);
      job.progress(60);
    } else if (mediaFile.mediaType === 'VIDEO') {
      // Extract video features
      features = await extractVideoFeatures(mediaFile.filePath);
      job.progress(60);
    } else if (mediaFile.mediaType === 'AUDIO') {
      // Extract audio features
      features = await extractAudioFeatures(mediaFile.filePath);
      job.progress(60);
    }

    // Save features to database
    await prisma.mediaFeatures.upsert({
      where: { mediaFileId },
      update: {
        faces: features.faces || null,
        faceCount: features.faces?.length || 0,
        objects: features.objects || null,
        objectCount: features.objects?.length || 0,
        sceneEmbedding: features.sceneEmbedding || null,
        dominantColors: features.dominantColors || null,
        audioFingerprint: features.audioFingerprint || null,
        speechText: features.speechText || null,
        audioEmbedding: features.audioEmbedding || null,
        keyframes: features.keyframes || null,
        motionVectors: features.motionVectors || null,
      },
      create: {
        mediaFileId,
        faces: features.faces || null,
        faceCount: features.faces?.length || 0,
        objects: features.objects || null,
        objectCount: features.objects?.length || 0,
        sceneEmbedding: features.sceneEmbedding || null,
        dominantColors: features.dominantColors || null,
        audioFingerprint: features.audioFingerprint || null,
        speechText: features.speechText || null,
        audioEmbedding: features.audioEmbedding || null,
        keyframes: features.keyframes || null,
        motionVectors: features.motionVectors || null,
      },
    });

    job.progress(80);

    // Add duplicate detection job
    await duplicateDetectionQueue.add('find-duplicates', {
      mediaFileId,
      jobType: 'duplicate_detection',
    }, {
      priority: 3,
    });

    job.progress(100);

    // Emit completion update
    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'features-extracted',
        progress: 100,
      });
    }

    return { success: true, mediaFileId, features };
  } catch (error) {
    console.error('Feature extraction failed:', error);
    
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: { 
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Feature extraction failed',
      },
    });

    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Feature extraction failed',
      });
    }

    throw error;
  }
});

duplicateDetectionQueue.process('find-duplicates', async (job) => {
  const { mediaFileId } = job.data;
  
  try {
    console.log(`Finding duplicates for media file: ${mediaFileId}`);
    
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: mediaFileId },
      include: { 
        features: true,
        user: {
          include: { userSettings: true }
        }
      },
    });

    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    job.progress(20);

    // Find potential duplicates based on hashes first (exact matches)
    const exactDuplicates = await prisma.mediaFile.findMany({
      where: {
        AND: [
          { id: { not: mediaFileId } },
          { userId: mediaFile.userId }, // Only check within user's files
          {
            OR: [
              { md5Hash: mediaFile.md5Hash },
              { sha256Hash: mediaFile.sha256Hash },
              ...(mediaFile.perceptualHash ? [{ perceptualHash: mediaFile.perceptualHash }] : []),
            ]
          }
        ]
      },
      include: { features: true },
    });

    job.progress(40);

    // Process exact duplicates
    for (const duplicate of exactDuplicates) {
      await prisma.duplicateMatch.upsert({
        where: {
          originalFileId_duplicateFileId: {
            originalFileId: mediaFileId,
            duplicateFileId: duplicate.id,
          }
        },
        update: {
          overallSimilarity: 1.0,
          matchType: 'exact',
          confidence: 1.0,
          status: 'AUTO_PROCESSED',
        },
        create: {
          originalFileId: mediaFileId,
          duplicateFileId: duplicate.id,
          overallSimilarity: 1.0,
          matchType: 'exact',
          confidence: 1.0,
          status: 'AUTO_PROCESSED',
        },
      });
    }

    job.progress(60);

    // Find semantic duplicates using ML features
    if (mediaFile.features) {
      const semanticDuplicates = await findSemanticDuplicates(mediaFile);
      
      for (const match of semanticDuplicates) {
        await prisma.duplicateMatch.upsert({
          where: {
            originalFileId_duplicateFileId: {
              originalFileId: mediaFileId,
              duplicateFileId: match.duplicateFileId,
            }
          },
          update: match,
          create: {
            originalFileId: mediaFileId,
            ...match,
          },
        });
      }
    }

    job.progress(90);

    // Update media file status
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: { processingStatus: 'COMPLETED' },
    });

    job.progress(100);

    // Emit completion update
    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'completed',
        progress: 100,
      });
    }

    return { success: true, mediaFileId };
  } catch (error) {
    console.error('Duplicate detection failed:', error);
    
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: { 
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Duplicate detection failed',
      },
    });

    if (global.io) {
      global.io.emit('processing-update', {
        mediaFileId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Duplicate detection failed',
      });
    }

    throw error;
  }
});

// Cleanup queue for maintenance tasks
cleanupQueue.process('cleanup-old-jobs', async (job) => {
  try {
    console.log('Running cleanup job');
    
    // Clean up old completed jobs
    const result = await prisma.processingJob.deleteMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
    });

    console.log(`Cleaned up ${result.count} old processing jobs`);
    
    return { success: true, cleanedJobs: result.count };
  } catch (error) {
    console.error('Cleanup job failed:', error);
    throw error;
  }
});

// Helper functions for ML processing
async function extractImageFeatures(filePath: string): Promise<any> {
  // This would call your ML service
  // For now, return mock data
  return {
    faces: [],
    objects: [],
    sceneEmbedding: new Array(512).fill(0).map(() => Math.random()),
    dominantColors: [
      { rgb: [255, 0, 0], percentage: 0.3 },
      { rgb: [0, 255, 0], percentage: 0.4 },
      { rgb: [0, 0, 255], percentage: 0.3 },
    ],
  };
}

async function extractVideoFeatures(filePath: string): Promise<any> {
  // This would call your ML service
  return {
    faces: [],
    objects: [],
    keyframes: [],
    motionVectors: [],
    audioFingerprint: 'mock_audio_fingerprint',
  };
}

async function extractAudioFeatures(filePath: string): Promise<any> {
  // This would call your ML service
  return {
    audioFingerprint: 'mock_audio_fingerprint',
    speechText: 'Mock transcribed speech',
    audioEmbedding: new Array(256).fill(0).map(() => Math.random()),
  };
}

async function findSemanticDuplicates(mediaFile: any): Promise<any[]> {
  // This would implement semantic similarity search
  // For now, return empty array
  return [];
}

// Queue management functions
export async function addMediaProcessingJob(data: ProcessingJobData): Promise<void> {
  await mediaProcessingQueue.add('process-media', data, {
    priority: data.priority || 1,
  });
}

export async function addFeatureExtractionJob(data: ProcessingJobData): Promise<void> {
  await featureExtractionQueue.add('extract-features', data, {
    priority: data.priority || 1,
  });
}

export async function addDuplicateDetectionJob(data: ProcessingJobData): Promise<void> {
  await duplicateDetectionQueue.add('find-duplicates', data, {
    priority: data.priority || 1,
  });
}

// Setup queues and scheduled jobs
export async function setupQueues(): Promise<void> {
  // Add recurring cleanup job
  cleanupQueue.add('cleanup-old-jobs', {}, {
    repeat: { cron: '0 2 * * *' }, // Run daily at 2 AM
    removeOnComplete: 1,
    removeOnFail: 1,
  });

  console.log('Queues initialized successfully');
}

// Graceful shutdown
export async function shutdownQueues(): Promise<void> {
  await Promise.all([
    mediaProcessingQueue.close(),
    duplicateDetectionQueue.close(),
    featureExtractionQueue.close(),
    cleanupQueue.close(),
  ]);
}