import type { ScanReport } from '@zovo/permissions-scanner';

/**
 * Format a single scan report or array of reports as pretty-printed JSON.
 */
export function formatJson(report: ScanReport | ScanReport[]): string {
  return JSON.stringify(report, null, 2);
}
