import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import sharp from "sharp"
import crypto from "crypto"
import { getFileType, formatBytes } from "@/lib/utils"
import { MediaType } from "@prisma/client"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "100000000") // 100MB default
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${formatBytes(MAX_FILE_SIZE)} limit` },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = getFileType(file.name)
    if (!['image', 'video', 'audio'].includes(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate file hash for duplicate detection
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Check if file already exists
    const existingFile = await db.mediaFile.findUnique({
      where: { hash }
    })

    if (existingFile) {
      return NextResponse.json(
        { error: "File already exists", existingFile },
        { status: 409 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomString}.${extension}`
    const filepath = join(UPLOAD_DIR, filename)

    // Save file to disk
    await writeFile(filepath, buffer)

    // Extract metadata based on file type
    let metadata: any = {
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    }

    try {
      if (fileType === 'image') {
        const imageInfo = await sharp(buffer).metadata()
        metadata = {
          ...metadata,
          width: imageInfo.width,
          height: imageInfo.height,
          format: imageInfo.format,
          channels: imageInfo.channels,
          density: imageInfo.density
        }
      }
      // TODO: Add video and audio metadata extraction
    } catch (error) {
      console.warn("Failed to extract metadata:", error)
    }

    // Save to database
    const mediaFile = await db.mediaFile.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        type: fileType.toUpperCase() as MediaType,
        path: filepath,
        hash,
        metadata,
        uploadedBy: session.user.id,
      }
    })

    // Trigger AI analysis and duplicate detection
    // In production, this would typically be done asynchronously using a queue system
    try {
      await DuplicateDetectionService.processFile(mediaFile.id)
      console.log(`AI analysis completed for file: ${mediaFile.id}`)
    } catch (error) {
      console.error(`AI analysis failed for file ${mediaFile.id}:`, error)
      // Continue with upload success even if AI analysis fails
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        id: mediaFile.id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        size: mediaFile.size,
        type: mediaFile.type,
        hash: mediaFile.hash,
      }
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}