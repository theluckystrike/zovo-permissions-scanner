import { scan, scanManifest } from '@zovo/permissions-scanner';
import type { ScanReport, ChromeManifest } from '@zovo/permissions-scanner';

/**
 * Scan a Chrome extension by its Chrome Web Store ID.
 *
 * Downloads the CRX, extracts the manifest, and produces a full
 * {@link ScanReport} with score, grade, risks, and bonuses.
 */
export async function scanExtension(extensionId: string): Promise<ScanReport> {
  return await scan(extensionId);
}

/**
 * Scan a raw Chrome extension manifest object.
 *
 * Useful when the caller already has the manifest JSON (e.g. from
 * a POST body) and doesn't need a CRX download.
 */
export function scanManifestService(manifest: ChromeManifest): ScanReport {
  return scanManifest(manifest);
}
