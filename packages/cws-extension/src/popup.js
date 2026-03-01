/**
 * Zovo Extension Scanner — Popup Logic (popup.js)
 *
 * Displays scan results for the current tab if it is a CWS extension page.
 */

(function () {
  'use strict';

  const GRADE_COLORS = {
    'A+': '#22c55e',
    A: '#4ade80',
    B: '#facc15',
    C: '#f97316',
    D: '#ef4444',
    F: '#1f2937',
  };

  const SEVERITY_ICONS = {
    critical: '\u{1F6D1}',
    high: '\u{1F534}',
    medium: '\u{1F7E0}',
    low: '\u{1F7E1}',
  };

  const REPORT_BASE_URL = 'https://scan.zovo.dev/report';

  // ── DOM References ──

  const loadingEl = document.getElementById('loading');
  const notCwsEl = document.getElementById('not-cws');
  const errorEl = document.getElementById('error');
  const errorDetailEl = document.getElementById('error-detail');
  const resultEl = document.getElementById('result');

  const gradeBadgeEl = document.getElementById('grade-badge');
  const gradeLabelEl = document.getElementById('grade-label');
  const gradeScoreEl = document.getElementById('grade-score');
  const summaryLineEl = document.getElementById('summary-line');
  const risksListEl = document.getElementById('risks-list');
  const fullReportLinkEl = document.getElementById('full-report-link');

  // ── Helpers ──

  function showState(state) {
    loadingEl.style.display = 'none';
    notCwsEl.style.display = 'none';
    errorEl.style.display = 'none';
    resultEl.style.display = 'none';

    switch (state) {
      case 'loading':
        loadingEl.style.display = 'flex';
        break;
      case 'not-cws':
        notCwsEl.style.display = 'block';
        break;
      case 'error':
        errorEl.style.display = 'block';
        break;
      case 'result':
        resultEl.style.display = 'block';
        break;
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Extract extension ID from a CWS URL.
   */
  function extractExtensionId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'chromewebstore.google.com') return null;
      if (!parsed.pathname.startsWith('/detail/')) return null;

      const segments = parsed.pathname.split('/').filter(Boolean);
      for (let i = segments.length - 1; i >= 0; i--) {
        if (/^[a-z]{32}$/.test(segments[i])) {
          return segments[i];
        }
      }
    } catch {
      // Invalid URL
    }
    return null;
  }

  /**
   * Render the scan report into the popup DOM.
   */
  function renderResult(report, extensionId) {
    const gradeColor = GRADE_COLORS[report.grade] || '#6b7280';
    const riskCount = report.risks ? report.risks.length : 0;
    const bonusCount = report.bonuses ? report.bonuses.length : 0;

    gradeBadgeEl.textContent = report.grade;
    gradeBadgeEl.style.background = gradeColor;

    gradeLabelEl.textContent = report.label;
    gradeScoreEl.textContent = `${report.score}/100`;

    // Summary line
    let summary = '';
    if (riskCount > 0) {
      summary += `\u{26A0}\u{FE0F} ${riskCount} risk${riskCount !== 1 ? 's' : ''} found`;
    } else {
      summary += '\u{2705} No risks found';
    }
    if (bonusCount > 0) {
      summary += ` \u{00B7} ${bonusCount} good practice${bonusCount !== 1 ? 's' : ''}`;
    }
    summaryLineEl.textContent = summary;

    // Risks list (top 5)
    risksListEl.innerHTML = '';
    if (report.risks && report.risks.length > 0) {
      const topRisks = report.risks.slice(0, 5);
      topRisks.forEach((risk) => {
        const item = document.createElement('div');
        item.className = 'risk-item';
        item.innerHTML = `
          <span class="risk-icon">${SEVERITY_ICONS[risk.severity] || '\u{26A0}\u{FE0F}'}</span>
          <span class="risk-text">
            <strong>${escapeHtml(risk.permission)}</strong> — ${escapeHtml(risk.reason)}
          </span>
        `;
        risksListEl.appendChild(item);
      });
    }

    fullReportLinkEl.href = `${REPORT_BASE_URL}/${extensionId}`;

    showState('result');
  }

  // ── Main ──

  async function main() {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      showState('not-cws');
      return;
    }

    const extensionId = extractExtensionId(tab.url);

    if (!extensionId) {
      showState('not-cws');
      return;
    }

    // Show loading
    showState('loading');

    // Request scan from background
    chrome.runtime.sendMessage(
      { action: 'SCAN_EXTENSION', extensionId },
      (response) => {
        if (chrome.runtime.lastError) {
          errorDetailEl.textContent = chrome.runtime.lastError.message || 'Communication error';
          showState('error');
          return;
        }

        if (!response) {
          errorDetailEl.textContent = 'No response from scanner';
          showState('error');
          return;
        }

        if (response.success && response.data) {
          renderResult(response.data, extensionId);
        } else {
          errorDetailEl.textContent = response.error || 'Scan failed';
          showState('error');
        }
      }
    );
  }

  main();
})();
