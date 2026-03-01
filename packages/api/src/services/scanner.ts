import { scan, scanManifest } from '@zovo/permissions-scanner';
import type { ScanReport, ChromeManifest } from '@zovo/permissions-scanner';
import type { Bindings } from '../types';

/**
 * Scan a Chrome extension by its Chrome Web Store ID.
 */
export async function scanExtension(extensionId: string, _env?: Bindings): Promise<ScanReport> {
  return await scan(extensionId);
}

/**
 * Scan a raw Chrome extension manifest object.
 */
export function scanManifestService(manifest: ChromeManifest, _env?: Bindings): ScanReport {
  return scanManifest(manifest);
}
