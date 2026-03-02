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

// "Cr24" as bytes — web-standard, no Buffer dependency
const CRX_MAGIC = new Uint8Array([0x43, 0x72, 0x32, 0x34]);

/** Read a little-endian uint32 from a Uint8Array at the given offset. */
function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    ((data[offset + 3] << 24) >>> 0)
  ) >>> 0;
}

/**
 * Check whether a string is a Chrome i18n message placeholder (e.g. `__MSG_extName__`).
 */
function isI18nPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('__MSG_') && value.endsWith('__');
}

/**
 * Extract the message key from a Chrome i18n placeholder.
 * `__MSG_extName__` -> `extName`
 */
function extractMessageKey(placeholder: string): string {
  return placeholder.slice(6, -2); // strip `__MSG_` prefix and `__` suffix
}

/**
 * Resolve Chrome i18n message placeholders in a manifest's `name` and `description` fields.
 *
 * Chrome extensions can use `__MSG_key__` placeholders in manifest.json that reference
 * strings defined in `_locales/<lang>/messages.json`. This function looks up those
 * placeholders in the English locale (`_locales/en/messages.json`) and replaces them
 * with the resolved human-readable strings.
 *
 * If the locale file is missing or the key is not found, the original placeholder
 * value is left unchanged.
 */
export async function resolveI18nMessages(
  zip: JSZip,
  manifest: ChromeManifest
): Promise<void> {
  const needsName = isI18nPlaceholder(manifest.name);
  const needsDescription = isI18nPlaceholder(manifest.description);

  if (!needsName && !needsDescription) {
    return;
  }

  // Try to find _locales/en/messages.json (case-insensitive folder match)
  const localeFile =
    zip.file('_locales/en/messages.json') ??
    zip.file('_locales/en_US/messages.json');

  if (!localeFile) {
    return;
  }

  let messages: Record<string, { message?: string }>;
  try {
    const text = await localeFile.async('text');
    messages = JSON.parse(text);
  } catch {
    // Malformed locale file — nothing we can do, leave placeholders as-is
    return;
  }

  if (needsName) {
    const key = extractMessageKey(manifest.name as string);
    // Chrome message keys are case-insensitive, so do a case-insensitive lookup
    const resolved = findMessageCaseInsensitive(messages, key);
    if (resolved) {
      manifest.name = resolved;
    }
  }

  if (needsDescription) {
    const key = extractMessageKey(manifest.description as string);
    const resolved = findMessageCaseInsensitive(messages, key);
    if (resolved) {
      manifest.description = resolved;
    }
  }
}

/**
 * Look up a message key case-insensitively in a Chrome i18n messages object.
 * Chrome treats message keys as case-insensitive.
 */
function findMessageCaseInsensitive(
  messages: Record<string, { message?: string }>,
  key: string
): string | undefined {
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(messages)) {
    if (k.toLowerCase() === lowerKey && typeof v?.message === 'string') {
      return v.message;
    }
  }
  return undefined;
}

/**
 * Extract manifest.json from a CRX3 file buffer.
 */
export async function extractManifestFromCrx(buffer: Uint8Array): Promise<ChromeManifest> {
  // Validate CRX magic number
  if (buffer.length < 16) {
    throw new Error('Invalid CRX file: too small');
  }

  for (let i = 0; i < 4; i++) {
    if (buffer[i] !== CRX_MAGIC[i]) {
      throw new Error('Invalid CRX file: missing Cr24 magic number');
    }
  }

  const version = readUint32LE(buffer, 4);
  if (version !== 3) {
    throw new Error(`Unsupported CRX version: ${version} (expected 3)`);
  }

  const headerLength = readUint32LE(buffer, 8);
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

  // Resolve i18n placeholders (e.g. __MSG_extName__ -> "Bitwarden")
  await resolveI18nMessages(zip, manifest);

  return manifest;
}

/**
 * Download a CRX file from the Chrome Web Store by extension ID.
 */
export async function downloadCrx(extensionId: string): Promise<Uint8Array> {
  const url =
    `https://clients2.google.com/service/update2/crx` +
    `?response=redirect&os=linux&arch=x86-64&os_arch=x86-64` +
    `&nacl_arch=x86-64&prod=chromiumcrx&prodchannel=unknown` +
    `&prodversion=130.0.0.0&acceptformat=crx3` +
    `&x=id%3D${extensionId}%26uc`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download extension ${extensionId}: HTTP ${response.status}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
