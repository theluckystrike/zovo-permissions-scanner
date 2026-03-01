/**
 * Extract extension ID from the current Chrome Web Store URL.
 *
 * URL format:
 *   https://chromewebstore.google.com/detail/extension-name/abcdefghijklmnop
 *
 * Chrome extension IDs are exactly 32 characters, lowercase a-p only
 * (base-16 encoding of the SHA-256 hash of the extension's public key).
 */
export function getExtensionId(): string | null {
  const match = window.location.pathname.match(/\/detail\/[^/]+\/([a-p]{32})/);
  return match ? match[1] : null;
}
