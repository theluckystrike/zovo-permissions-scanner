import JSZip from 'jszip';
import { ChromeManifest } from './types';
import { validateManifest } from './manifest-parser';

/**
 * CRX3 file format header:
 *   - 4 bytes: "Cr24" magic number
 *   - 4 bytes: version (3)
 *   - 4 bytes: header length
 *   - N bytes: header proto (skip)
 *   - rest: ZIP archive
 */
const CRX_MAGIC = Buffer.from('Cr24');

/**
 * Extract manifest.json from a CRX3 file buffer.
 */
export async function extractManifestFromCrx(buffer: Buffer): Promise<ChromeManifest> {
  // Validate CRX magic number
  if (buffer.length < 16) {
    throw new Error('Invalid CRX file: too small');
  }

  const magic = buffer.subarray(0, 4);
  if (!magic.equals(CRX_MAGIC)) {
    throw new Error('Invalid CRX file: missing Cr24 magic number');
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 3) {
    throw new Error(`Unsupported CRX version: ${version} (expected 3)`);
  }

  const headerLength = buffer.readUInt32LE(8);
  const zipStart = 12 + headerLength;

  if (zipStart >= buffer.length) {
    throw new Error('Invalid CRX file: header extends beyond file');
  }

  const zipBuffer = buffer.subarray(zipStart);

  // Extract manifest.json from the ZIP
  const zip = await JSZip.loadAsync(zipBuffer);
  const manifestFile = zip.file('manifest.json');

  if (!manifestFile) {
    throw new Error('Invalid CRX file: no manifest.json found');
  }

  const manifestText = await manifestFile.async('text');
  let manifest: unknown;

  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error('Invalid manifest.json: failed to parse JSON');
  }

  if (!validateManifest(manifest)) {
    throw new Error('Invalid manifest.json: missing or invalid manifest_version');
  }

  return manifest;
}

/**
 * Download a CRX file from the Chrome Web Store by extension ID.
 */
export async function downloadCrx(extensionId: string): Promise<Buffer> {
  const url =
    `https://clients2.google.com/service/update2/crx` +
    `?response=redirect&prodversion=120.0&x=id%3D${extensionId}%26uc`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download extension ${extensionId}: HTTP ${response.status}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
