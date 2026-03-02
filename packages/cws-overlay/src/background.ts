/**
 * Zovo CWS Overlay — Background Service Worker
 *
 * Handles cross-origin API calls on behalf of the content script.
 * Content scripts on chromewebstore.google.com cannot make requests to
 * api.zovo.one directly, so they send a message here and the
 * service worker performs the fetch.
 *
 * Message protocol:
 *   Request:  { type: 'SCAN_EXTENSION', extensionId: string }
 *   Response: { success: true, data: ScanReport }
 *           | { success: false, error: string }
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

const API_BASE = 'https://api.zovo.one';

/**
 * Listen for messages from the content script.
 * Returning `true` from the listener keeps the message channel open
 * so that `sendResponse` can be called asynchronously.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_EXTENSION') {
    handleScanRequest(message.extensionId)
      .then((report) => sendResponse({ success: true, data: report }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response
  }
});

/**
 * Fetch a scan report from the Zovo API.
 *
 * Strategy:
 *   1. Try GET /api/report/:id — returns an existing report if one is cached
 *      on the server.
 *   2. If that 404s (or otherwise fails), fall back to POST /api/scan which
 *      triggers a fresh scan and returns the result.
 */
async function handleScanRequest(extensionId: string): Promise<ScanReport> {
  // Try GET /api/report/:id first
  const reportRes = await fetch(`${API_BASE}/api/report/${extensionId}`);
  if (reportRes.ok) {
    return await reportRes.json();
  }

  // Fallback: POST /api/scan
  const scanRes = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extension_id: extensionId }),
  });

  if (!scanRes.ok) {
    throw new Error(`API returned ${scanRes.status}`);
  }

  return await scanRes.json();
}
