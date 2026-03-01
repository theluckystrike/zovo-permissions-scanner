import { scanManifest, validateManifest } from '@zovo/permissions-scanner';
import type { ScanReport } from '@zovo/permissions-scanner';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Read a manifest.json file from disk and run the Zovo permissions scanner.
 * Throws if the file doesn't exist or the manifest is invalid.
 */
export function scanManifestFile(manifestPath: string): ScanReport {
  const resolved = path.resolve(manifestPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Manifest file not found: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, 'utf-8');

  let manifest: unknown;
  try {
    manifest = JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse JSON at ${resolved}`);
  }

  if (!validateManifest(manifest)) {
    throw new Error(
      `Invalid manifest at ${resolved}: missing or invalid manifest_version (must be 2 or 3)`
    );
  }

  return scanManifest(manifest);
}
