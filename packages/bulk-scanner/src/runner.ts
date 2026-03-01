import { scan } from '@zovo/permissions-scanner';
import type { ScanReport } from '@zovo/permissions-scanner';
import { computeStats, ScanStats } from './stats';

export interface BulkScanOptions {
  extensionIds: string[];
  delayMs: number;
  concurrency: number;
  onProgress?: (
    current: number,
    total: number,
    report: ScanReport | null,
    error?: string
  ) => void;
}

export interface BulkScanResult {
  reports: ScanReport[];
  errors: { extensionId: string; error: string }[];
  stats: ScanStats;
  duration: number;
}

/**
 * Delay for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Bulk scan a list of Chrome extension IDs.
 * Scans sequentially with a configurable delay between each scan.
 */
export async function bulkScan(options: BulkScanOptions): Promise<BulkScanResult> {
  const { extensionIds, delayMs, onProgress } = options;
  const reports: ScanReport[] = [];
  const errors: { extensionId: string; error: string }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < extensionIds.length; i++) {
    const extensionId = extensionIds[i];

    try {
      const report = await scan(extensionId);
      reports.push(report);
      onProgress?.(i + 1, extensionIds.length, report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({ extensionId, error: errorMessage });
      onProgress?.(i + 1, extensionIds.length, null, errorMessage);
    }

    // Delay between scans (skip delay after the last scan)
    if (i < extensionIds.length - 1) {
      await delay(delayMs);
    }
  }

  const duration = Date.now() - startTime;
  const stats = computeStats(reports, errors.length);

  return { reports, errors, stats, duration };
}
