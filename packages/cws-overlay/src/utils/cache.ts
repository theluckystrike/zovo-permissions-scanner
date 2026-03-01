/**
 * Cache layer for Zovo scan reports.
 *
 * Reports are stored in chrome.storage.local with a 24-hour TTL so that
 * repeated visits to the same CWS listing don't trigger redundant API calls.
 */

interface ScanReport {
  extension_id: string;
  name: string;
  version: string;
  score: number;
  grade: string;
  label: string;
  color: string;
  risks: { permission: string; severity: string; reason: string; recommendation?: string }[];
  bonuses: { type: string; reason: string }[];
  summary: string;
  scanned_at: string;
}

/** 24 hours in milliseconds. */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Retrieve a cached report for the given extension ID.
 * Returns `null` if no cached entry exists or the entry has expired.
 */
export async function getCachedReport(extensionId: string): Promise<ScanReport | null> {
  const key = `report_${extensionId}`;
  const result = await chrome.storage.local.get(key);
  const cached = result[key];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.report as ScanReport;
  }

  return null;
}

/**
 * Store a report in the cache, tagged with the current timestamp.
 */
export async function cacheReport(extensionId: string, report: ScanReport): Promise<void> {
  const key = `report_${extensionId}`;
  await chrome.storage.local.set({ [key]: { report, timestamp: Date.now() } });
}
