import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { DuplicateGroup, MediaFile, FilterOptions } from '@/types/media';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      format, 
      duplicateGroups, 
      allFiles, 
      filters,
      includeStats = true 
    }: {
      format: 'json' | 'csv' | 'pdf';
      duplicateGroups: DuplicateGroup[];
      allFiles: MediaFile[];
      filters: FilterOptions;
      includeStats?: boolean;
    } = body;

    if (!duplicateGroups || !Array.isArray(duplicateGroups)) {
      return NextResponse.json({ error: 'Invalid duplicate groups data' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `duplicate-report-${timestamp}`;

    let reportData: any;
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case 'json':
        reportData = generateJSONReport(duplicateGroups, allFiles, filters, includeStats);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      
      case 'csv':
        reportData = generateCSVReport(duplicateGroups, allFiles, filters, includeStats);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      
      case 'pdf':
        // For PDF, we'll return JSON data that the frontend can use to generate PDF
        reportData = generatePDFData(duplicateGroups, allFiles, filters, includeStats);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Return the data directly for download
    const response = new NextResponse(reportData);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}.${fileExtension}"`);
    
    return response;

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateJSONReport(
  duplicateGroups: DuplicateGroup[], 
  allFiles: MediaFile[], 
  filters: FilterOptions, 
  includeStats: boolean
) {
  const stats = calculateStats(duplicateGroups, allFiles);
  
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      filters: filters
    },
    ...(includeStats && { stats }),
    duplicateGroups: duplicateGroups.map(group => ({
      id: group.id,
      type: group.type,
      similarity: group.similarity,
      verified: group.verified,
      createdAt: group.createdAt,
      primaryFile: group.primaryFile ? {
        id: group.primaryFile.id,
        name: group.primaryFile.name,
        path: group.primaryFile.path,
        size: group.primaryFile.size,
        type: group.primaryFile.type
      } : null,
      files: group.files.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        mimeType: file.mimeType,
        hash: file.hash,
        perceptualHash: file.perceptualHash,
        createdAt: file.createdAt,
        modifiedAt: file.modifiedAt,
        dimensions: file.dimensions,
        tags: file.tags,
        source: file.source
      }))
    }))
  };

  return JSON.stringify(report, null, 2);
}

function generateCSVReport(
  duplicateGroups: DuplicateGroup[], 
  allFiles: MediaFile[], 
  filters: FilterOptions, 
  includeStats: boolean
) {
  const headers = [
    'Group ID',
    'Group Type',
    'Similarity %',
    'Verified',
    'File ID',
    'File Name',
    'File Path',
    'File Size (bytes)',
    'File Type',
    'MIME Type',
    'Hash',
    'Perceptual Hash',
    'Created Date',
    'Modified Date',
    'Width',
    'Height',
    'Tags',
    'Source',
    'Is Primary'
  ];

  const rows = [headers];

  duplicateGroups.forEach(group => {
    group.files.forEach(file => {
      const row = [
        group.id,
        group.type,
        group.similarity.toString(),
        group.verified ? 'Yes' : 'No',
        file.id,
        file.name,
        file.path,
        file.size.toString(),
        file.type,
        file.mimeType,
        file.hash,
        file.perceptualHash || '',
        file.createdAt.toString(),
        file.modifiedAt.toString(),
        file.dimensions?.width?.toString() || '',
        file.dimensions?.height?.toString() || '',
        file.tags.join(';'),
        file.source,
        file.id === group.primaryFile?.id ? 'Yes' : 'No'
      ];
      rows.push(row);
    });
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generatePDFData(
  duplicateGroups: DuplicateGroup[], 
  allFiles: MediaFile[], 
  filters: FilterOptions, 
  includeStats: boolean
) {
  const stats = calculateStats(duplicateGroups, allFiles);
  
  return {
    title: 'Duplicate Media Files Report',
    generatedAt: new Date().toISOString(),
    stats: includeStats ? stats : null,
    filters,
    summary: {
      totalGroups: duplicateGroups.length,
      totalDuplicateFiles: duplicateGroups.reduce((sum, group) => sum + group.files.length, 0),
      verifiedGroups: duplicateGroups.filter(group => group.verified).length,
      unverifiedGroups: duplicateGroups.filter(group => !group.verified).length,
      typeBreakdown: {
        exact: duplicateGroups.filter(group => group.type === 'exact').length,
        perceptual: duplicateGroups.filter(group => group.type === 'perceptual').length,
        nearDuplicate: duplicateGroups.filter(group => group.type === 'near-duplicate').length
      }
    },
    groups: duplicateGroups.map(group => ({
      id: group.id,
      type: group.type,
      similarity: group.similarity,
      verified: group.verified,
      fileCount: group.files.length,
      totalSize: group.files.reduce((sum, file) => sum + file.size, 0),
      potentialSavings: group.files.reduce((sum, file) => sum + file.size, 0) - (group.primaryFile?.size || 0),
      files: group.files.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        dimensions: file.dimensions,
        modifiedAt: file.modifiedAt,
        isPrimary: file.id === group.primaryFile?.id
      }))
    }))
  };
}

function calculateStats(duplicateGroups: DuplicateGroup[], allFiles: MediaFile[]) {
  const totalDuplicateFiles = duplicateGroups.reduce(
    (sum, group) => sum + group.files.length, 0
  );
  
  const potentialSpaceSaved = duplicateGroups.reduce((total, group) => {
    if (group.files.length <= 1) return total;
    const primarySize = group.primaryFile?.size || 0;
    const totalSize = group.files.reduce((sum, file) => sum + file.size, 0);
    return total + (totalSize - primarySize);
  }, 0);

  const totalFileSize = allFiles.reduce((sum, file) => sum + file.size, 0);
  
  const fileTypeBreakdown = allFiles.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceBreakdown = allFiles.reduce((acc, file) => {
    acc[file.source] = (acc[file.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalFiles: allFiles.length,
    totalFileSize,
    totalDuplicateFiles,
    duplicateGroups: duplicateGroups.length,
    potentialSpaceSaved,
    spaceSavingsPercentage: totalFileSize > 0 ? (potentialSpaceSaved / totalFileSize) * 100 : 0,
    verifiedGroups: duplicateGroups.filter(group => group.verified).length,
    unverifiedGroups: duplicateGroups.filter(group => !group.verified).length,
    fileTypeBreakdown,
    sourceBreakdown,
    duplicateTypeBreakdown: {
      exact: duplicateGroups.filter(group => group.type === 'exact').length,
      perceptual: duplicateGroups.filter(group => group.type === 'perceptual').length,
      nearDuplicate: duplicateGroups.filter(group => group.type === 'near-duplicate').length
    }
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'Export API ready',
    supportedFormats: ['json', 'csv', 'pdf'],
    endpoints: {
      export: 'POST with format, duplicateGroups, allFiles, filters, includeStats'
    }
  });
}