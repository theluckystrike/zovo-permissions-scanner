import * as fs from 'fs';
import * as path from 'path';
import { ChromeManifest } from '@zovo/permissions-scanner';

export type InputType = 'manifest' | 'crx' | 'extension_id';

/**
 * Detect whether the input is a manifest.json path, a .crx file path,
 * or a Chrome Web Store extension ID.
 */
export function detectInputType(input: string): InputType {
  if (input.endsWith('.json')) {
    return 'manifest';
  }
  if (input.endsWith('.crx')) {
    return 'crx';
  }
  return 'extension_id';
}

/**
 * Read and parse a manifest.json file from disk.
 */
export function readManifestFile(filePath: string): ChromeManifest {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Manifest file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');

  try {
    return JSON.parse(raw) as ChromeManifest;
  } catch {
    throw new Error(`Failed to parse manifest file as JSON: ${resolved}`);
  }
}

/**
 * Read a .crx file from disk and return its contents as a Buffer.
 */
export function readCrxFile(filePath: string): Buffer {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`CRX file not found: ${resolved}`);
  }

  return fs.readFileSync(resolved);
}
