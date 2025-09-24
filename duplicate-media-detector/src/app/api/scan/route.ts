import { NextRequest, NextResponse } from 'next/server';
import { FileScanner } from '@/lib/fileScanner';
import { DuplicateDetector } from '@/lib/duplicateDetector';
import { MediaFile, DuplicateGroup, ScanProgress } from '@/types/media';

// Store active scan sessions
const activeScanSessions = new Map<string, {
  scanner: FileScanner;
  detector: DuplicateDetector;
  progress: ScanProgress;
  results?: {
    files: MediaFile[];
    duplicates: DuplicateGroup[];
  };
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, directoryPath, filePaths, similarityThreshold = 90 } = body;

    switch (action) {
      case 'start':
        return await startScan(sessionId, directoryPath, filePaths, similarityThreshold);
      
      case 'status':
        return getStatus(sessionId);
      
      case 'stop':
        return stopScan(sessionId);
      
      case 'results':
        return getResults(sessionId);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startScan(
  sessionId: string,
  directoryPath?: string,
  filePaths?: string[],
  similarityThreshold: number = 90
) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  if (!directoryPath && (!filePaths || filePaths.length === 0)) {
    return NextResponse.json({ 
      error: 'Either directoryPath or filePaths must be provided' 
    }, { status: 400 });
  }

  // Create progress callback
  let currentProgress: ScanProgress = {
    total: 0,
    processed: 0,
    current: '',
    stage: 'scanning',
    duplicatesFound: 0
  };

  const onProgress = (progress: ScanProgress) => {
    currentProgress = progress;
    if (activeScanSessions.has(sessionId)) {
      activeScanSessions.get(sessionId)!.progress = progress;
    }
  };

  // Create scanner and detector
  const scanner = new FileScanner(onProgress);
  const detector = new DuplicateDetector(similarityThreshold, (progress) => {
    const scanProgress: ScanProgress = {
      ...currentProgress,
      stage: 'comparing',
      processed: progress.processed,
      total: progress.total,
      current: progress.stage
    };
    onProgress(scanProgress);
  });

  // Store session
  activeScanSessions.set(sessionId, {
    scanner,
    detector,
    progress: currentProgress
  });

  // Start scanning in background
  (async () => {
    try {
      let files: MediaFile[];
      
      if (directoryPath) {
        files = await scanner.scanDirectory(directoryPath);
      } else {
        files = await scanner.processFiles(filePaths!);
      }

      // Find duplicates
      onProgress({
        ...currentProgress,
        stage: 'comparing',
        processed: 0,
        total: files.length
      });

      const duplicates = await detector.findDuplicates(files);

      // Store results
      const session = activeScanSessions.get(sessionId);
      if (session) {
        session.results = { files, duplicates };
        session.progress = {
          ...currentProgress,
          stage: 'complete',
          processed: files.length,
          total: files.length,
          duplicatesFound: duplicates.length
        };
      }

    } catch (error) {
      console.error('Scan error:', error);
      const session = activeScanSessions.get(sessionId);
      if (session) {
        session.progress = {
          ...currentProgress,
          stage: 'complete',
          current: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  })();

  return NextResponse.json({
    success: true,
    sessionId,
    message: 'Scan started'
  });
}

function getStatus(sessionId: string) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = activeScanSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    progress: session.progress,
    isComplete: session.progress.stage === 'complete',
    hasResults: !!session.results
  });
}

function stopScan(sessionId: string) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = activeScanSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Stop the scanner
  session.scanner.stop();

  return NextResponse.json({
    success: true,
    message: 'Scan stopped'
  });
}

function getResults(sessionId: string) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = activeScanSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!session.results) {
    return NextResponse.json({ 
      error: 'Results not ready yet',
      progress: session.progress 
    }, { status: 202 });
  }

  return NextResponse.json({
    success: true,
    files: session.results.files,
    duplicates: session.results.duplicates,
    stats: {
      totalFiles: session.results.files.length,
      duplicateGroups: session.results.duplicates.length,
      totalDuplicateFiles: session.results.duplicates.reduce(
        (sum, group) => sum + group.files.length, 0
      ),
      potentialSpaceSaved: calculateSpaceSaved(session.results.duplicates)
    }
  });
}

function calculateSpaceSaved(duplicates: DuplicateGroup[]): number {
  return duplicates.reduce((total, group) => {
    if (group.files.length <= 1) return total;
    
    // Calculate space that could be saved by keeping only the primary file
    const primarySize = group.primaryFile?.size || 0;
    const totalSize = group.files.reduce((sum, file) => sum + file.size, 0);
    
    return total + (totalSize - primarySize);
  }, 0);
}

export async function GET() {
  return NextResponse.json({
    message: 'Scan API ready',
    activeSessions: activeScanSessions.size,
    endpoints: {
      start: 'POST with action: "start", sessionId, directoryPath or filePaths',
      status: 'POST with action: "status", sessionId',
      stop: 'POST with action: "stop", sessionId',
      results: 'POST with action: "results", sessionId'
    }
  });
}