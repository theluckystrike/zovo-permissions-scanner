import { ChromeManifest, ScanReport, ScanOptions } from './types';
import { parseManifest, validateManifest } from './manifest-parser';
import { calculateScore } from './scoring';
import { generateSummary } from './report-generator';
import { extractManifestFromCrx, downloadCrx } from './crx-extractor';

const SCANNER_VERSION = '1.0.0';

/**
 * Scan a Chrome extension manifest and produce a full report.
 */
export function scanManifest(
  manifest: ChromeManifest,
  options?: ScanOptions
): ScanReport {
  if (!validateManifest(manifest)) {
    throw new Error('Invalid manifest: missing or invalid manifest_version (must be 2 or 3)');
  }

  const parsed = parseManifest(manifest);
  const scoreResult = calculateScore(parsed, manifest);

  const partial = {
    extension_id: options?.extensionId ?? '',
    name: (manifest.name as string) ?? 'Unknown Extension',
    version: (manifest.version as string) ?? '0.0.0',
    score: scoreResult.score,
    grade: scoreResult.grade,
    label: scoreResult.label,
    color: scoreResult.color,
    permissions: parsed,
    risks: scoreResult.risks,
    bonuses: scoreResult.bonuses,
    scanned_at: new Date().toISOString(),
    scanner_version: SCANNER_VERSION,
  };

  const summary = generateSummary(partial);

  return { ...partial, summary };
}

/**
 * Scan from a CRX file buffer.
 */
export async function scanFromCrx(
  buffer: Buffer,
  options?: ScanOptions
): Promise<ScanReport> {
  const manifest = await extractManifestFromCrx(buffer);
  return scanManifest(manifest, options);
}

/**
 * Scan by extension ID — downloads from the Chrome Web Store.
 */
export async function scan(
  extensionId: string,
  options?: ScanOptions
): Promise<ScanReport> {
  const buffer = await downloadCrx(extensionId);
  const manifest = await extractManifestFromCrx(buffer);
  return scanManifest(manifest, {
    extensionId,
    ...options,
  });
}
