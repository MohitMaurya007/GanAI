import { db } from './db'
import { AIAnalysisService, AnalysisResult } from './ai-analysis'
import { MediaType, ValidationMethod, DuplicateStatus } from '@prisma/client'
import { getFileType } from './utils'

export interface DuplicateDetectionConfig {
  minSimilarityThreshold: number // 0-100
  minConfidenceThreshold: number // 0-100
  enabledMethods: ValidationMethod[]
  autoApproveThreshold: number // 0-100 - auto-approve if similarity is above this
}

const DEFAULT_CONFIG: DuplicateDetectionConfig = {
  minSimilarityThreshold: 75,
  minConfidenceThreshold: 80,
  enabledMethods: [
    ValidationMethod.FACIAL_RECOGNITION,
    ValidationMethod.SCENE_SIMILARITY,
    ValidationMethod.OBJECT_DETECTION,
    ValidationMethod.AUDIO_FINGERPRINT
  ],
  autoApproveThreshold: 95
}

export class DuplicateDetectionService {
  
  static async processFile(fileId: string, config: DuplicateDetectionConfig = DEFAULT_CONFIG) {
    try {
      // Get the uploaded file
      const file = await db.mediaFile.findUnique({
        where: { id: fileId }
      })

      if (!file) {
        throw new Error('File not found')
      }

      console.log(`Processing file: ${file.originalName} (${file.type})`)

      // Perform AI analysis
      const analysisResults = await this.analyzeFile(file.path, file.type)
      
      // Store analysis results
      await this.storeAnalysisResults(fileId, analysisResults)

      // Find potential duplicates
      await this.findDuplicates(fileId, analysisResults, config)

      console.log(`Completed processing for file: ${fileId}`)

    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error)
      throw error
    }
  }

  private static async analyzeFile(filePath: string, mediaType: MediaType): Promise<AnalysisResult[]> {
    switch (mediaType) {
      case MediaType.IMAGE:
        return await AIAnalysisService.analyzeImage(filePath)
      case MediaType.VIDEO:
        return await AIAnalysisService.analyzeVideo(filePath)
      case MediaType.AUDIO:
        return await AIAnalysisService.analyzeAudio(filePath)
      default:
        throw new Error(`Unsupported media type: ${mediaType}`)
    }
  }

  private static async storeAnalysisResults(fileId: string, results: AnalysisResult[]) {
    for (const result of results) {
      await db.aIAnalysisResult.create({
        data: {
          fileId,
          method: result.method,
          results: result.features,
          confidence: result.confidence,
        }
      })
    }
  }

  private static async findDuplicates(
    fileId: string, 
    analysisResults: AnalysisResult[], 
    config: DuplicateDetectionConfig
  ) {
    const currentFile = await db.mediaFile.findUnique({
      where: { id: fileId }
    })

    if (!currentFile) return

    // Find all other files of the same type uploaded by the same user
    const candidateFiles = await db.mediaFile.findMany({
      where: {
        id: { not: fileId },
        type: currentFile.type,
        uploadedBy: currentFile.uploadedBy
      },
      include: {
        analysisResults: true
      }
    })

    console.log(`Found ${candidateFiles.length} candidate files for comparison`)

    // Compare with each candidate file
    for (const candidateFile of candidateFiles) {
      await this.compareFiles(
        fileId,
        candidateFile.id,
        analysisResults,
        candidateFile.analysisResults,
        config
      )
    }
  }

  private static async compareFiles(
    fileId1: string,
    fileId2: string,
    results1: AnalysisResult[],
    results2: any[], // Prisma result type
    config: DuplicateDetectionConfig
  ) {
    // Convert database results to our format
    const analysisResults2: AnalysisResult[] = results2.map(r => ({
      method: r.method,
      features: r.results,
      confidence: r.confidence
    }))

    // Compare using each enabled method
    for (const method of config.enabledMethods) {
      const result1 = results1.find(r => r.method === method)
      const result2 = analysisResults2.find(r => r.method === method)

      if (!result1 || !result2) continue

      // Calculate similarity
      const similarity = AIAnalysisService.calculateSimilarity(
        result1.features,
        result2.features,
        method
      )

      // Check if similarity meets threshold
      if (similarity.similarity >= config.minSimilarityThreshold && 
          similarity.confidence >= config.minConfidenceThreshold) {
        
        // Determine status
        const status = similarity.similarity >= config.autoApproveThreshold 
          ? DuplicateStatus.AUTO_APPROVED 
          : DuplicateStatus.PENDING

        // Check if this match already exists
        const existingMatch = await db.duplicateMatch.findUnique({
          where: {
            originalFileId_duplicateFileId_method: {
              originalFileId: fileId1,
              duplicateFileId: fileId2,
              method: method
            }
          }
        })

        if (!existingMatch) {
          // Create duplicate match record
          await db.duplicateMatch.create({
            data: {
              originalFileId: fileId1,
              duplicateFileId: fileId2,
              similarityScore: similarity.similarity,
              confidenceLevel: similarity.confidence,
              method: method,
              status: status
            }
          })

          console.log(
            `Found duplicate: ${fileId1} <-> ${fileId2} ` +
            `(${method}, ${similarity.similarity.toFixed(2)}% similarity, ${status})`
          )
        }
      }
    }
  }

  static async getDuplicatesForUser(userId: string, status?: DuplicateStatus) {
    const where: any = {
      originalFile: {
        uploadedBy: userId
      }
    }

    if (status) {
      where.status = status
    }

    return await db.duplicateMatch.findMany({
      where,
      include: {
        originalFile: true,
        duplicateFile: true,
        validations: {
          include: {
            validator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async validateDuplicate(
    matchId: string,
    validatorId: string,
    action: 'approve' | 'reject' | 'archive' | 'delete',
    notes?: string
  ) {
    // Update match status
    const newStatus = action === 'approve' 
      ? DuplicateStatus.APPROVED 
      : DuplicateStatus.REJECTED

    await db.duplicateMatch.update({
      where: { id: matchId },
      data: { status: newStatus }
    })

    // Create validation record
    await db.duplicateValidation.create({
      data: {
        matchId,
        validatedBy: validatorId,
        action,
        notes
      }
    })

    // If action is delete, remove the duplicate file
    if (action === 'delete') {
      const match = await db.duplicateMatch.findUnique({
        where: { id: matchId },
        include: {
          duplicateFile: true
        }
      })

      if (match?.duplicateFile) {
        // TODO: Delete file from filesystem
        // await fs.unlink(match.duplicateFile.path)
        
        // Remove from database
        await db.mediaFile.delete({
          where: { id: match.duplicateFile.id }
        })
      }
    }
  }

  static async getSystemStats() {
    const [
      totalFiles,
      totalDuplicates,
      pendingReview,
      autoApproved,
      userValidated
    ] = await Promise.all([
      db.mediaFile.count(),
      db.duplicateMatch.count(),
      db.duplicateMatch.count({
        where: { status: DuplicateStatus.PENDING }
      }),
      db.duplicateMatch.count({
        where: { status: DuplicateStatus.AUTO_APPROVED }
      }),
      db.duplicateMatch.count({
        where: { status: DuplicateStatus.APPROVED }
      })
    ])

    return {
      totalFiles,
      totalDuplicates,
      pendingReview,
      autoApproved,
      userValidated,
      accuracyRate: userValidated > 0 ? (userValidated / (userValidated + pendingReview)) * 100 : 0
    }
  }

  static async updateDetectionConfig(config: Partial<DuplicateDetectionConfig>) {
    // Store config in database
    await db.systemConfig.upsert({
      where: { key: 'duplicate_detection_config' },
      update: {
        value: config,
        updatedAt: new Date()
      },
      create: {
        key: 'duplicate_detection_config',
        value: config,
        description: 'Duplicate detection configuration'
      }
    })
  }

  static async getDetectionConfig(): Promise<DuplicateDetectionConfig> {
    const config = await db.systemConfig.findUnique({
      where: { key: 'duplicate_detection_config' }
    })

    if (config) {
      return { ...DEFAULT_CONFIG, ...config.value as any }
    }

    return DEFAULT_CONFIG
  }
}