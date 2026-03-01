/**
 * Zovo Extension Scanner — Content Script (content.js)
 *
 * Injected into Chrome Web Store extension detail pages.
 * Extracts the extension ID, requests a scan, and renders an overlay badge.
 */

(function () {
  'use strict';

  // ── Constants ──

  const GRADE_COLORS = {
    'A+': '#22c55e',
    A: '#4ade80',
    B: '#facc15',
    C: '#f97316',
    D: '#ef4444',
    F: '#1f2937',
  };

  const SEVERITY_ICONS = {
    critical: '\u{1F6D1}', // stop sign
    high: '\u{1F534}',     // red circle
    medium: '\u{1F7E0}',   // orange circle
    low: '\u{1F7E1}',      // yellow circle
  };

  const REPORT_BASE_URL = 'https://scan.zovo.dev/report';

  // ── Helpers ──

  /**
   * Extract the extension ID from the current URL.
   * URL pattern: chromewebstore.google.com/detail/<name>/<extension_id>
   * The extension ID is a 32-character lowercase alpha string.
   */
  function getExtensionId() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    // Walk backwards to find the 32 lowercase-letter segment
    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^[a-z]{32}$/.test(segments[i])) {
        return segments[i];
      }
    }
    return null;
  }

  /**
   * Grade color indicator circle (emoji-free, just a colored dot).
   */
  function gradeIndicator(grade) {
    const color = GRADE_COLORS[grade] || '#6b7280';
    return `<span style="
      display:inline-block;
      width:12px;height:12px;
      border-radius:50%;
      background:${color};
      margin-left:8px;
      vertical-align:middle;
    "></span>`;
  }

  // ── Overlay Rendering ──

  /**
   * Create the shadow DOM host and return the shadow root.
   */
  function createOverlayHost() {
    const host = document.createElement('div');
    host.id = 'zovo-scanner-overlay';
    const shadow = host.attachShadow({ mode: 'closed' });
    return { host, shadow };
  }

  /**
   * Render the loading state inside the shadow root.
   */
  function renderLoading(shadow) {
    shadow.innerHTML = `
      <style>${getOverlayStyles()}</style>
      <div class="zovo-card zovo-fade-in">
        <div class="zovo-header">
          <span class="zovo-shield">\u{1F6E1}\u{FE0F}</span>
          <span class="zovo-title">Zovo Privacy Score</span>
        </div>
        <div class="zovo-loading">
          <div class="zovo-spinner"></div>
          <span>Scanning extension...</span>
        </div>
        <div class="zovo-footer">Powered by Zovo</div>
      </div>
    `;
  }

  /**
   * Render the scan report inside the shadow root.
   */
  function renderReport(shadow, report, extensionId) {
    const gradeColor = GRADE_COLORS[report.grade] || '#6b7280';
    const riskCount = report.risks ? report.risks.length : 0;
    const bonusCount = report.bonuses ? report.bonuses.length : 0;

    // Build risk list (top 5)
    let risksHtml = '';
    if (report.risks && report.risks.length > 0) {
      const topRisks = report.risks.slice(0, 5);
      risksHtml = `
        <div class="zovo-risks">
          ${topRisks
            .map(
              (r) => `
            <div class="zovo-risk-item">
              <span class="zovo-risk-icon">${SEVERITY_ICONS[r.severity] || '\u{26A0}\u{FE0F}'}</span>
              <span class="zovo-risk-text">
                <strong>${escapeHtml(r.permission)}</strong> — ${escapeHtml(r.reason)}
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    shadow.innerHTML = `
      <style>${getOverlayStyles()}</style>
      <div class="zovo-card zovo-fade-in">
        <div class="zovo-header">
          <span class="zovo-shield">\u{1F6E1}\u{FE0F}</span>
          <span class="zovo-title">Zovo Privacy Score</span>
          <button class="zovo-close" aria-label="Close">\u{2715}</button>
        </div>

        <div class="zovo-grade-row">
          <div class="zovo-grade-badge" style="background:${gradeColor};">
            ${escapeHtml(report.grade)}
          </div>
          <div class="zovo-grade-info">
            <div class="zovo-label">${escapeHtml(report.label)}</div>
            <div class="zovo-score">${report.score}/100</div>
          </div>
        </div>

        <div class="zovo-summary-line">
          ${riskCount > 0 ? `\u{26A0}\u{FE0F} ${riskCount} risk${riskCount !== 1 ? 's' : ''} found` : '\u{2705} No risks found'}
          ${bonusCount > 0 ? ` \u{00B7} ${bonusCount} good practice${bonusCount !== 1 ? 's' : ''}` : ''}
        </div>

        ${risksHtml}

        <a class="zovo-link" href="${REPORT_BASE_URL}/${extensionId}" target="_blank" rel="noopener">
          View full report \u{2192}
        </a>

        <div class="zovo-footer">Powered by Zovo</div>
      </div>
    `;

    // Close button handler
    const closeBtn = shadow.querySelector('.zovo-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const host = document.getElementById('zovo-scanner-overlay');
        if (host) host.style.display = 'none';
      });
    }
  }

  /**
   * Render an error state.
   */
  function renderError(shadow, errorMessage) {
    shadow.innerHTML = `
      <style>${getOverlayStyles()}</style>
      <div class="zovo-card zovo-fade-in">
        <div class="zovo-header">
          <span class="zovo-shield">\u{1F6E1}\u{FE0F}</span>
          <span class="zovo-title">Zovo Privacy Score</span>
          <button class="zovo-close" aria-label="Close">\u{2715}</button>
        </div>
        <div class="zovo-error">
          <span>\u{26A0}\u{FE0F} Unable to scan this extension</span>
          <p class="zovo-error-detail">${escapeHtml(errorMessage)}</p>
        </div>
        <div class="zovo-footer">Powered by Zovo</div>
      </div>
    `;

    const closeBtn = shadow.querySelector('.zovo-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const host = document.getElementById('zovo-scanner-overlay');
        if (host) host.style.display = 'none';
      });
    }
  }

  /**
   * Escape HTML to prevent injection.
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Inline styles for the shadow DOM overlay.
   * These are scoped to the shadow root and won't leak into the CWS page.
   */
  function getOverlayStyles() {
    return `
      *, *::before, *::after {
        box-sizing: border-box;
      }

      .zovo-card {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        padding: 16px 20px;
        max-width: 400px;
        width: 100%;
        color: #1f2937;
        line-height: 1.5;
        margin: 16px 0;
      }

      .zovo-fade-in {
        animation: zovoFadeIn 0.3s ease-out;
      }

      @keyframes zovoFadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .zovo-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f3f4f6;
      }

      .zovo-shield {
        font-size: 20px;
        line-height: 1;
      }

      .zovo-title {
        font-weight: 600;
        font-size: 14px;
        color: #374151;
        flex: 1;
      }

      .zovo-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        font-size: 16px;
        padding: 2px 6px;
        border-radius: 4px;
        line-height: 1;
      }

      .zovo-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .zovo-grade-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }

      .zovo-grade-badge {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 700;
        color: #ffffff;
        flex-shrink: 0;
        text-shadow: 0 1px 2px rgba(0,0,0,0.15);
      }

      .zovo-grade-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .zovo-label {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }

      .zovo-score {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }

      .zovo-summary-line {
        font-size: 13px;
        color: #4b5563;
        margin-bottom: 10px;
      }

      .zovo-risks {
        border-top: 1px solid #f3f4f6;
        padding-top: 10px;
        margin-bottom: 10px;
      }

      .zovo-risk-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 4px 0;
        font-size: 12px;
        color: #4b5563;
      }

      .zovo-risk-icon {
        flex-shrink: 0;
        font-size: 14px;
        line-height: 1.4;
      }

      .zovo-risk-text {
        line-height: 1.4;
      }

      .zovo-risk-text strong {
        color: #1f2937;
        font-weight: 600;
      }

      .zovo-link {
        display: inline-block;
        font-size: 13px;
        font-weight: 500;
        color: #2563eb;
        text-decoration: none;
        margin-bottom: 10px;
      }

      .zovo-link:hover {
        text-decoration: underline;
      }

      .zovo-footer {
        font-size: 11px;
        color: #9ca3af;
        text-align: right;
        padding-top: 8px;
        border-top: 1px solid #f3f4f6;
      }

      .zovo-loading {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 0;
        font-size: 13px;
        color: #6b7280;
      }

      .zovo-spinner {
        width: 20px;
        height: 20px;
        border: 2.5px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: zovoSpin 0.7s linear infinite;
        flex-shrink: 0;
      }

      @keyframes zovoSpin {
        to { transform: rotate(360deg); }
      }

      .zovo-error {
        padding: 12px 0;
        font-size: 13px;
        color: #dc2626;
      }

      .zovo-error-detail {
        margin: 6px 0 0 0;
        font-size: 12px;
        color: #6b7280;
      }
    `;
  }

  // ── Injection ──

  /**
   * Find a good insertion point in the CWS page.
   * Tries to insert near the top of the main content area.
   */
  function findInsertionPoint() {
    // Try to find the header/title area of the CWS detail page
    // The CWS page structure uses a main content div
    const selectors = [
      'div[class*="C-b-p-j-D"]',       // Known CWS title container
      'div[class*="e-f-o"]',            // Alternative title area
      '.C-b-p-j-Pb',                    // Another known CWS class
      'header',                         // Generic header
      'main',                           // Generic main
      '[role="main"]',                  // ARIA main
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Fallback: use body
    return document.body;
  }

  /**
   * Main entry point. Extracts the extension ID, creates the overlay, and triggers the scan.
   */
  function init() {
    // Don't inject twice
    if (document.getElementById('zovo-scanner-overlay')) return;

    const extensionId = getExtensionId();
    if (!extensionId) return;

    // Create shadow DOM host
    const { host, shadow } = createOverlayHost();

    // Show loading state
    renderLoading(shadow);

    // Insert into page
    const insertionPoint = findInsertionPoint();
    if (insertionPoint === document.body) {
      document.body.prepend(host);
    } else {
      insertionPoint.parentNode.insertBefore(host, insertionPoint);
    }

    // Request scan from background service worker
    chrome.runtime.sendMessage(
      { action: 'SCAN_EXTENSION', extensionId },
      (response) => {
        if (chrome.runtime.lastError) {
          renderError(shadow, chrome.runtime.lastError.message || 'Extension communication error');
          return;
        }

        if (!response) {
          renderError(shadow, 'No response from scanner');
          return;
        }

        if (response.success && response.data) {
          renderReport(shadow, response.data, extensionId);
        } else {
          renderError(shadow, response.error || 'Scan failed');
        }
      }
    );
  }

  // ── SPA Navigation Handling ──
  // CWS uses client-side navigation, so we need to re-run on URL changes.

  let lastUrl = window.location.href;

  function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Remove old overlay
      const existing = document.getElementById('zovo-scanner-overlay');
      if (existing) existing.remove();
      // Re-init if on a detail page
      if (/chromewebstore\.google\.com\/detail\//.test(currentUrl)) {
        // Small delay to let the page render
        setTimeout(init, 500);
      }
    }
  }

  // Observe URL changes via History API
  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    checkUrlChange();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    checkUrlChange();
  };

  window.addEventListener('popstate', checkUrlChange);

  // Run on initial load
  init();
})();
