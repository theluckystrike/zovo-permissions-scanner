/**
 * Zovo Extension Scanner — Service Worker (background.js)
 *
 * Handles API communication with the Zovo scan API.
 * Caches results in chrome.storage.local for 24 hours.
 */

const API_BASE = 'https://api.scan.zovo.dev/api';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Retrieve a cached report from chrome.storage.local.
 * Returns the report if it exists and is younger than CACHE_TTL_MS, else null.
 */
async function getCachedReport(extensionId) {
  const key = `report_${extensionId}`;
  const result = await chrome.storage.local.get(key);
  const entry = result[key];

  if (!entry) return null;

  const age = Date.now() - entry.cachedAt;
  if (age > CACHE_TTL_MS) {
    // Expired — remove it
    await chrome.storage.local.remove(key);
    return null;
  }

  return entry.report;
}

/**
 * Cache a report in chrome.storage.local with a timestamp.
 */
async function cacheReport(extensionId, report) {
  const key = `report_${extensionId}`;
  await chrome.storage.local.set({
    [key]: {
      report,
      cachedAt: Date.now(),
    },
  });
}

/**
 * Fetch a scan report from the Zovo API.
 * Tries GET /api/report/:id first. If that 404s, falls back to POST /api/scan.
 */
async function fetchReport(extensionId) {
  // Try the report endpoint first (may already be cached server-side)
  const getUrl = `${API_BASE}/report/${extensionId}`;
  const getResp = await fetch(getUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (getResp.ok) {
    return await getResp.json();
  }

  // If 404, trigger a fresh scan
  if (getResp.status === 404) {
    const postUrl = `${API_BASE}/scan`;
    const postResp = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extension_id: extensionId }),
    });

    if (postResp.ok) {
      return await postResp.json();
    }

    const errData = await postResp.json().catch(() => ({}));
    throw new Error(errData.error || `Scan failed with status ${postResp.status}`);
  }

  const errData = await getResp.json().catch(() => ({}));
  throw new Error(errData.error || `API returned status ${getResp.status}`);
}

/**
 * Message listener — handles SCAN_EXTENSION requests from content script and popup.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'SCAN_EXTENSION') return false;

  const { extensionId } = message;

  if (!extensionId || !/^[a-z]{32}$/.test(extensionId)) {
    sendResponse({ success: false, error: 'Invalid extension ID format.' });
    return false;
  }

  // Async handler — must return true to keep the message channel open
  (async () => {
    try {
      // Check local cache first
      const cached = await getCachedReport(extensionId);
      if (cached) {
        sendResponse({ success: true, data: cached });
        return;
      }

      // Fetch from API
      const report = await fetchReport(extensionId);

      // Cache locally
      await cacheReport(extensionId, report);

      sendResponse({ success: true, data: report });
    } catch (err) {
      sendResponse({ success: false, error: err.message || 'Unknown error' });
    }
  })();

  // Return true to indicate we will respond asynchronously
  return true;
});
