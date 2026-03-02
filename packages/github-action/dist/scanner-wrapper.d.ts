import type { ScanReport } from '@zovo/permissions-scanner';
/**
 * Read a manifest.json file from disk and run the Zovo permissions scanner.
 * Throws if the file doesn't exist or the manifest is invalid.
 */
export declare function scanManifestFile(manifestPath: string): ScanReport;
