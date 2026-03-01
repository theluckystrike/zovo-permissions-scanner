/**
 * Card component for the Zovo CWS Overlay.
 * Renders the expanded detail card inside the shadow DOM.
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

const MAX_VISIBLE_RISKS = 5;

/**
 * Maps a risk severity to its corresponding emoji.
 */
function severityEmoji(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return '\u{1F534}';
  if (s === 'medium') return '\u{1F7E1}';
  return '\u{1F7E2}';
}

/**
 * Returns a human-readable relative time string from an ISO timestamp.
 */
function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) return '';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Helper to create an element with a class name and optional text content.
 */
function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * Creates the expanded card showing full scan details.
 */
export function createCard(report: ScanReport, onCollapse: () => void): HTMLElement {
  const card = el('div', 'zovo-card');

  // ── Header ──
  const header = el('div', 'zovo-card-header');
  const title = el('span', 'zovo-card-header-title', '\u{1F6E1}\u{FE0F} Zovo Privacy Score');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'zovo-card-close';
  closeBtn.textContent = '\u2715';
  closeBtn.setAttribute('aria-label', 'Close score card');
  closeBtn.addEventListener('click', onCollapse);
  header.appendChild(title);
  header.appendChild(closeBtn);
  card.appendChild(header);

  // ── Score ──
  const scoreSection = el('div', 'zovo-card-score');
  const scoreNumber = el('span', 'zovo-card-score-number');
  scoreNumber.textContent = String(report.score);
  scoreNumber.style.color = report.color;
  const scoreMax = el('span', 'zovo-card-score-max', ' / 100');
  scoreSection.appendChild(scoreNumber);
  scoreSection.appendChild(scoreMax);
  card.appendChild(scoreSection);

  // ── Grade ──
  const gradeLine = el('div', 'zovo-card-grade', `Grade: ${report.grade}`);
  gradeLine.style.color = report.color;
  card.appendChild(gradeLine);

  // ── Label ──
  const label = el('div', 'zovo-card-label', `\u201C${report.label}\u201D`);
  card.appendChild(label);

  // ── Risks ──
  if (report.risks.length > 0) {
    const risksSection = el('div', 'zovo-card-section');
    risksSection.appendChild(el('div', 'zovo-card-section-title', '\u26A0\uFE0F Risks'));

    const visibleRisks = report.risks.slice(0, MAX_VISIBLE_RISKS);
    for (const risk of visibleRisks) {
      const row = el('div', 'zovo-card-risk');
      const emoji = el('span', 'zovo-card-risk-emoji', severityEmoji(risk.severity));
      const text = el('span', undefined, risk.reason);
      row.appendChild(emoji);
      row.appendChild(text);
      risksSection.appendChild(row);
    }

    const remaining = report.risks.length - MAX_VISIBLE_RISKS;
    if (remaining > 0) {
      risksSection.appendChild(
        el('div', 'zovo-card-risk-more', `and ${remaining} more\u2026`)
      );
    }

    card.appendChild(risksSection);
  }

  // ── Bonuses ──
  if (report.bonuses.length > 0) {
    const bonusSection = el('div', 'zovo-card-section');
    bonusSection.appendChild(el('div', 'zovo-card-section-title', '\u2705 Good'));

    for (const bonus of report.bonuses) {
      const row = el('div', 'zovo-card-bonus');
      const emoji = el('span', undefined, '\u2705');
      const text = el('span', undefined, bonus.reason);
      row.appendChild(emoji);
      row.appendChild(text);
      bonusSection.appendChild(row);
    }

    card.appendChild(bonusSection);
  }

  // ── Divider ──
  card.appendChild(el('hr', 'zovo-card-divider'));

  // ── Full Report link ──
  const link = document.createElement('a');
  link.className = 'zovo-card-link';
  link.href = `https://scan.zovo.dev/report/${report.extension_id}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Full Report \u2192';
  card.appendChild(link);

  // ── Footer ──
  const footer = el('div', 'zovo-card-footer');
  const footerText = document.createTextNode('Powered by Zovo \u00B7 ');
  const footerLink = document.createElement('a');
  footerLink.href = 'https://zovo.dev';
  footerLink.target = '_blank';
  footerLink.rel = 'noopener noreferrer';
  footerLink.textContent = 'zovo.dev';
  footer.appendChild(footerText);
  footer.appendChild(footerLink);
  card.appendChild(footer);

  // ── Last scanned ──
  const scannedAt = relativeTime(report.scanned_at);
  if (scannedAt) {
    const scannedLine = el('div', 'zovo-card-scanned', `Scanned ${scannedAt}`);
    card.appendChild(scannedLine);
  }

  return card;
}
