/**
 * API communication layer for Zovo scan reports.
 *
 * Content scripts cannot make cross-origin requests, so this module
 * delegates the actual fetch to the background service worker via
 * chrome.runtime.sendMessage.
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

/**
 * Request a scan report for the given extension ID.
 *
 * Sends a `SCAN_EXTENSION` message to the background service worker,
 * which performs the API call and returns the result. The response
 * follows the `{ success, data, error }` envelope pattern.
 */
export function fetchReport(extensionId: string): Promise<ScanReport> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'SCAN_EXTENSION', extensionId },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success && response.data) {
          resolve(response.data as ScanReport);
        } else {
          reject(new Error(response?.error || 'Failed to fetch report'));
        }
      }
    );
  });
}
