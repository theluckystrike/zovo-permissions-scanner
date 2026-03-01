/**
 * Badge components for the Zovo CWS Overlay.
 * These render the collapsed pill-shaped badge in the shadow DOM.
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
 * Creates the main score badge pill.
 *
 * ┌──────────────────────┐
 * │ 🛡️ Zovo Score: B 72  │
 * └──────────────────────┘
 */
export function createBadge(report: ScanReport, onExpand: () => void): HTMLElement {
  const badge = document.createElement('button');
  badge.className = 'zovo-badge';
  badge.style.backgroundColor = report.color;
  badge.textContent = `\u{1F6E1}\u{FE0F} Zovo Score: ${report.grade} ${report.score}`;
  badge.setAttribute('aria-label', `Zovo Privacy Score: ${report.grade}, ${report.score} out of 100. Click to expand.`);
  badge.addEventListener('click', onExpand);
  return badge;
}

/**
 * Creates a loading badge shown while the scan is in progress.
 */
export function createLoadingBadge(): HTMLElement {
  const badge = document.createElement('button');
  badge.className = 'zovo-badge zovo-badge-loading';
  badge.style.backgroundColor = '#6b7280';
  badge.textContent = '\u{1F6E1}\u{FE0F} Scanning\u2026';
  badge.setAttribute('aria-label', 'Zovo Privacy Score: scanning in progress');
  badge.disabled = true;
  return badge;
}

/**
 * Creates an error badge with a retry action.
 */
export function createErrorBadge(onRetry: () => void): HTMLElement {
  const badge = document.createElement('button');
  badge.className = 'zovo-badge';
  badge.style.backgroundColor = '#ef4444';
  badge.textContent = '\u{26A0}\u{FE0F} Scan failed \u2014 retry';
  badge.setAttribute('aria-label', 'Zovo Privacy Score: scan failed. Click to retry.');
  badge.addEventListener('click', onRetry);
  return badge;
}
