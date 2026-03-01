import * as fs from 'fs';
import * as path from 'path';
import type { ScanReport } from '@zovo/permissions-scanner';

export interface FailedScan {
  id: string;
  name: string;
  error: string;
}

export interface ScanResult {
  report: ScanReport;
  extensionMeta: { id: string; name: string; category: string };
}

interface ProgressFile {
  results: Array<{ report: ScanReport; extensionMeta: { id: string; name: string; category: string } }>;
  failures: FailedScan[];
  completedIds: string[];
  lastUpdated: string;
}

export interface ProgressData {
  results: Array<{ report: ScanReport; extensionMeta: { id: string; name: string; category: string } }>;
  failures: FailedScan[];
  completedIds: Set<string>;
  lastUpdated: string;
}

const PROGRESS_FILE = path.resolve(__dirname, '..', '..', 'data', 'progress.json');

/**
 * Load progress from disk. Returns empty progress if file doesn't exist.
 */
export function loadProgress(): ProgressData {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return {
      results: [],
      failures: [],
      completedIds: new Set(),
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    const data: ProgressFile = JSON.parse(raw);
    return {
      results: data.results || [],
      failures: data.failures || [],
      completedIds: new Set(data.completedIds || []),
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return {
      results: [],
      failures: [],
      completedIds: new Set(),
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Save progress to disk. Called after each successful/failed scan.
 */
export function saveProgress(data: ProgressData): void {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const serializable: ProgressFile = {
    results: data.results,
    failures: data.failures,
    completedIds: Array.from(data.completedIds),
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(serializable, null, 2));
}

/**
 * Clear all progress data.
 */
export function clearProgress(): void {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}
