import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { FileScanner } from '@/lib/fileScanner';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!FileScanner.isMediaFile(file.name)) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        // Create unique filename to avoid conflicts
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        uploadedFiles.push(filepath);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    return NextResponse.json({
      success: true,
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Upload endpoint ready',
    supportedTypes: [
      'Images: JPG, PNG, GIF, BMP, WebP, TIFF, SVG',
      'Videos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP'
    ]
  });
}