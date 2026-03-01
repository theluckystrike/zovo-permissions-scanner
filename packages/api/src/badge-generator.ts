import type { ScanReport, Grade } from '@zovo/permissions-scanner';
import type { BadgeStyle } from './types';

/** Grade-to-color mapping matching the project brief. */
const GRADE_COLORS: Record<Grade, string> = {
  'A+': '#22c55e',
  A: '#4ade80',
  B: '#facc15',
  C: '#f97316',
  D: '#ef4444',
  F: '#1f2937',
};

/** Approximate pixel width per character at the default font size (~11 px). */
const CHAR_WIDTH = 7;

/** Padding added to each side of a text section. */
const SIDE_PADDING = 6;

/**
 * Estimate the pixel width of a string given a per-character width.
 */
function estimateTextWidth(text: string, charWidth = CHAR_WIDTH, padding = SIDE_PADDING): number {
  return text.length * charWidth + padding * 2;
}

/**
 * Generate a shields.io-style SVG badge for a scan report.
 *
 * Badge format: `[Zovo Score | {grade} {score}]`
 *
 * Three styles are supported:
 * - **flat** (default) -- 20 px height, linear gradient overlay, rounded corners.
 * - **plastic** -- 20 px height, multi-stop glossy gradient.
 * - **for-the-badge** -- 28 px height, uppercase text, letter-spacing 1, font-size 9.
 *
 * @param report  The scan report to render.
 * @param style   Badge style (defaults to `'flat'`).
 * @returns       A complete SVG string.
 */
export function generateBadge(
  report: ScanReport,
  style: BadgeStyle = 'flat',
): string {
  const gradeColor = GRADE_COLORS[report.grade] ?? '#1f2937';
  const valueText = `${report.grade} ${report.score}`;

  switch (style) {
    case 'plastic':
      return generatePlastic(gradeColor, valueText);
    case 'for-the-badge':
      return generateForTheBadge(gradeColor, valueText);
    case 'flat':
    default:
      return generateFlat(gradeColor, valueText);
  }
}

// ── Flat Style ──────────────────────────────────────────────────────────────

function generateFlat(gradeColor: string, valueText: string): string {
  const label = 'Zovo Score';
  const labelWidth = estimateTextWidth(label);
  const valueWidth = estimateTextWidth(valueText);
  const totalWidth = labelWidth + valueWidth;
  const labelCenter = labelWidth / 2;
  const valueCenter = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a"><rect width="${totalWidth}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${gradeColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelCenter}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelCenter}" y="14">${label}</text>
    <text x="${valueCenter}" y="15" fill="#010101" fill-opacity=".3">${valueText}</text>
    <text x="${valueCenter}" y="14">${valueText}</text>
  </g>
</svg>`;
}

// ── Plastic Style ───────────────────────────────────────────────────────────

function generatePlastic(gradeColor: string, valueText: string): string {
  const label = 'Zovo Score';
  const labelWidth = estimateTextWidth(label);
  const valueWidth = estimateTextWidth(valueText);
  const totalWidth = labelWidth + valueWidth;
  const labelCenter = labelWidth / 2;
  const valueCenter = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".3"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>
  <clipPath id="a"><rect width="${totalWidth}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${gradeColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelCenter}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelCenter}" y="14">${label}</text>
    <text x="${valueCenter}" y="15" fill="#010101" fill-opacity=".3">${valueText}</text>
    <text x="${valueCenter}" y="14">${valueText}</text>
  </g>
</svg>`;
}

// ── For-the-Badge Style ─────────────────────────────────────────────────────

function generateForTheBadge(gradeColor: string, valueText: string): string {
  const label = 'ZOVO SCORE';
  const value = valueText.toUpperCase();
  const charWidth = 6.5;
  const sidePadding = 9;
  const labelWidth = estimateTextWidth(label, charWidth, sidePadding);
  const valueWidth = estimateTextWidth(value, charWidth, sidePadding);
  const totalWidth = labelWidth + valueWidth;
  const labelCenter = labelWidth / 2;
  const valueCenter = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28">
  <clipPath id="a"><rect width="${totalWidth}" height="28" rx="3"/></clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="28" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="28" fill="${gradeColor}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="9" letter-spacing="1">
    <text x="${labelCenter}" y="18" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelCenter}" y="17">${label}</text>
    <text x="${valueCenter}" y="18" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${valueCenter}" y="17">${value}</text>
  </g>
</svg>`;
}
