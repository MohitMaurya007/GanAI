import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, fileIds, filePaths, groupId, tags } = body;

    switch (action) {
      case 'delete':
        return await deleteFiles(filePaths);
      
      case 'tag':
        return await tagFiles(fileIds, tags);
      
      case 'verify-group':
        return await verifyGroup(groupId);
      
      case 'set-primary':
        return await setPrimaryFile(groupId, fileIds[0]);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Duplicates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteFiles(filePaths: string[]) {
  if (!filePaths || filePaths.length === 0) {
    return NextResponse.json({ error: 'No file paths provided' }, { status: 400 });
  }

  const results = {
    deleted: [] as string[],
    errors: [] as string[]
  };

  for (const filePath of filePaths) {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
        results.deleted.push(filePath);
      } else {
        results.errors.push(`${filePath}: File not found`);
      }
    } catch (error) {
      console.error(`Error deleting ${filePath}:`, error);
      results.errors.push(`${filePath}: Delete failed`);
    }
  }

  return NextResponse.json({
    success: true,
    deleted: results.deleted.length,
    errors: results.errors.length > 0 ? results.errors : undefined
  });
}

async function tagFiles(fileIds: string[], tags: string[]) {
  // In a real application, this would update the database
  // For now, we'll just return success
  return NextResponse.json({
    success: true,
    message: `Tagged ${fileIds.length} files with ${tags.length} tags`
  });
}

async function verifyGroup(groupId: string) {
  // In a real application, this would update the group's verified status
  return NextResponse.json({
    success: true,
    message: `Group ${groupId} marked as verified`
  });
}

async function setPrimaryFile(groupId: string, fileId: string) {
  // In a real application, this would update the group's primary file
  return NextResponse.json({
    success: true,
    message: `Primary file set for group ${groupId}`
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Duplicates API ready',
    endpoints: {
      delete: 'POST with action: "delete", filePaths',
      tag: 'POST with action: "tag", fileIds, tags',
      verify: 'POST with action: "verify-group", groupId',
      setPrimary: 'POST with action: "set-primary", groupId, fileIds'
    }
  });
}