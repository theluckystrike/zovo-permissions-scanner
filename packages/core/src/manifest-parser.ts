import { ChromeManifest, ParsedPermissions } from './types';

/**
 * Host permission patterns that count as "all URLs"
 */
const ALL_URL_PATTERNS = new Set(['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*']);

/**
 * Check if a string looks like a host permission pattern rather than an API permission.
 * Host patterns contain :// or are <all_urls>.
 */
function isHostPattern(perm: string): boolean {
  return perm.includes('://') || perm === '<all_urls>';
}

/**
 * Parse a Chrome extension manifest.json into a normalized permission structure.
 * Handles both Manifest V2 and V3 formats.
 */
export function parseManifest(manifest: ChromeManifest): ParsedPermissions {
  const mv = manifest.manifest_version;

  let required: string[] = [];
  let optional: string[] = [];
  let hostPermissions: string[] = [];
  const contentScriptsMatches: string[] = [];

  if (mv === 3) {
    // MV3: permissions are API-only, host_permissions are separate
    required = (manifest.permissions ?? []).filter((p) => !isHostPattern(p));
    hostPermissions = [
      ...(manifest.host_permissions ?? []),
      ...(manifest.permissions ?? []).filter(isHostPattern),
    ];
    optional = [
      ...(manifest.optional_permissions ?? []),
      ...(manifest.optional_host_permissions ?? []),
    ];
  } else {
    // MV2: permissions array contains both API permissions and host patterns
    const allPerms = manifest.permissions ?? [];
    required = allPerms.filter((p) => !isHostPattern(p));
    hostPermissions = allPerms.filter(isHostPattern);
    optional = manifest.optional_permissions ?? [];
  }

  // Extract content_scripts match patterns
  if (manifest.content_scripts) {
    for (const cs of manifest.content_scripts) {
      if (cs.matches) {
        contentScriptsMatches.push(...cs.matches);
      }
    }
  }

  // Deduplicate
  return {
    required: [...new Set(required)],
    optional: [...new Set(optional)],
    host_permissions: [...new Set(hostPermissions)],
    content_scripts_matches: [...new Set(contentScriptsMatches)],
  };
}

/**
 * Get all permissions that need to be scored (required + host patterns).
 * Optional permissions are NOT penalized (they're a bonus).
 */
export function getAllScoredPermissions(parsed: ParsedPermissions): string[] {
  const perms = [...parsed.required];

  // Add broad host patterns as pseudo-permissions for scoring
  for (const host of parsed.host_permissions) {
    if (ALL_URL_PATTERNS.has(host)) {
      perms.push('<all_urls>');
    }
  }

  // Add broad content script matches
  for (const match of parsed.content_scripts_matches) {
    if (ALL_URL_PATTERNS.has(match)) {
      if (!perms.includes('<all_urls>')) {
        perms.push('<all_urls>');
      }
    }
  }

  return [...new Set(perms)];
}

/**
 * Count the number of specific (non-wildcard) host permission domains.
 */
export function countHostDomains(hostPermissions: string[]): {
  specific: number;
  wildcardSubdomains: number;
  allUrls: boolean;
} {
  let specific = 0;
  let wildcardSubdomains = 0;
  let allUrls = false;

  for (const host of hostPermissions) {
    if (ALL_URL_PATTERNS.has(host)) {
      allUrls = true;
    } else if (host.includes('*.')) {
      wildcardSubdomains++;
    } else if (isHostPattern(host)) {
      specific++;
    }
  }

  return { specific, wildcardSubdomains, allUrls };
}

/**
 * Detect if the manifest indicates an open-source project.
 */
export function detectOpenSource(manifest: ChromeManifest): boolean {
  const url = manifest.homepage_url ?? '';
  return /github\.com|gitlab\.com|bitbucket\.org|codeberg\.org/i.test(url);
}

/**
 * Detect if the manifest has a privacy policy.
 * MV3 typically doesn't store this in manifest, but some extensions include it.
 */
export function detectPrivacyPolicy(manifest: ChromeManifest): boolean {
  // Check for common privacy policy indicators in manifest
  const raw = JSON.stringify(manifest).toLowerCase();
  return raw.includes('privacy') && (raw.includes('policy') || raw.includes('privacy_policy'));
}

/**
 * Validate that the input looks like a Chrome extension manifest.
 */
export function validateManifest(obj: unknown): obj is ChromeManifest {
  if (!obj || typeof obj !== 'object') return false;
  const manifest = obj as Record<string, unknown>;
  return (
    typeof manifest.manifest_version === 'number' &&
    (manifest.manifest_version === 2 || manifest.manifest_version === 3)
  );
}
