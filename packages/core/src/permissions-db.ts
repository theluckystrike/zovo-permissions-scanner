import { PermissionEntry, ComboRule, Severity } from './types';

// ── Risk Weights by Severity ──

export const RISK_WEIGHTS: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 2,
};

// ── Permission Risk Database ──

const entries: PermissionEntry[] = [
  // Critical Risk
  {
    permission: '<all_urls>',
    severity: 'critical',
    reason: 'Access to ALL websites — can read and modify every page you visit',
    recommendation: 'Use specific host permissions or activeTab for click-triggered access',
  },
  {
    permission: '*://*/*',
    severity: 'critical',
    reason: 'Access to ALL websites — can read and modify every page you visit',
    recommendation: 'Use specific host permissions or activeTab for click-triggered access',
  },
  {
    permission: 'debugger',
    severity: 'critical',
    reason: 'Full browser debugging access — can inspect and modify any page',
    recommendation: 'Only justified for developer tools extensions',
  },
  {
    permission: 'nativeMessaging',
    severity: 'critical',
    reason: 'Can communicate with applications installed on your computer',
    recommendation: 'Avoid unless native app communication is essential',
  },
  {
    permission: 'proxy',
    severity: 'critical',
    reason: 'Can intercept and redirect all network traffic',
    recommendation: 'Only justified for VPN/proxy extensions',
  },
  {
    permission: 'vpnProvider',
    severity: 'critical',
    reason: 'VPN-level network access — can route all traffic',
    recommendation: 'Only justified for VPN extensions',
  },
  {
    permission: 'content_settings',
    severity: 'critical',
    reason: 'Can modify browser security settings like JavaScript, cookies, and plugins',
    recommendation: 'Avoid unless content settings control is the core feature',
  },

  // High Risk
  {
    permission: 'cookies',
    severity: 'high',
    reason: 'Can read and write cookies for any site',
    recommendation: 'Limit cookie access to specific domains if possible',
  },
  {
    permission: 'history',
    severity: 'high',
    reason: 'Full access to browsing history',
    recommendation: 'Use optional_permissions to request history access only when needed',
  },
  {
    permission: 'bookmarks',
    severity: 'high',
    reason: 'Can read all bookmarks',
    recommendation: 'Use optional_permissions if bookmark access is not always needed',
  },
  {
    permission: 'downloads',
    severity: 'high',
    reason: 'Can monitor and control file downloads',
    recommendation: 'Only request if download management is a core feature',
  },
  {
    permission: 'management',
    severity: 'high',
    reason: 'Can disable, enable, or uninstall other extensions',
    recommendation: 'Avoid unless extension management is the core feature',
  },
  {
    permission: 'privacy',
    severity: 'high',
    reason: 'Can modify browser privacy settings',
    recommendation: 'Only justified for privacy-focused extensions',
  },
  {
    permission: 'webRequest',
    severity: 'high',
    reason: 'Can observe all network requests',
    recommendation: 'Use declarativeNetRequest for content blocking instead',
  },
  {
    permission: 'webRequestBlocking',
    severity: 'high',
    reason: 'Can intercept and modify all network requests',
    recommendation: 'Use declarativeNetRequest for content blocking instead',
  },
  {
    permission: 'declarativeNetRequestWithHostAccess',
    severity: 'high',
    reason: 'Can modify network requests for matched hosts',
    recommendation: 'Limit host patterns to only the domains you need',
  },

  // Medium Risk
  {
    permission: 'tabs',
    severity: 'medium',
    reason: 'Can see URLs and titles of all open tabs',
    recommendation: 'Consider using activeTab if only the current tab is needed',
  },
  {
    permission: 'activeTab',
    severity: 'low',
    reason: 'Access to the current tab only when user clicks the extension',
    recommendation: undefined,
  },
  {
    permission: 'notifications',
    severity: 'medium',
    reason: 'Can show desktop notifications',
    recommendation: undefined,
  },
  {
    permission: 'webNavigation',
    severity: 'medium',
    reason: 'Can monitor page navigation events across all tabs',
    recommendation: 'Use activeTab if only current tab navigation is needed',
  },
  {
    permission: 'topSites',
    severity: 'medium',
    reason: 'Can read your most visited sites',
    recommendation: 'Use optional_permissions if not always needed',
  },
  {
    permission: 'geolocation',
    severity: 'medium',
    reason: 'Can access your physical location',
    recommendation: 'Use optional_permissions to request only when needed',
  },
  {
    permission: 'clipboardRead',
    severity: 'medium',
    reason: 'Can read your clipboard contents',
    recommendation: 'Use optional_permissions to request only when needed',
  },
  {
    permission: 'clipboardWrite',
    severity: 'medium',
    reason: 'Can write to your clipboard',
    recommendation: undefined,
  },
  {
    permission: 'declarativeNetRequest',
    severity: 'medium',
    reason: 'Can block or modify network requests using rules',
    recommendation: undefined,
  },

  // Low Risk
  {
    permission: 'storage',
    severity: 'low',
    reason: 'Can store data locally in the browser',
    recommendation: undefined,
  },
  {
    permission: 'contextMenus',
    severity: 'low',
    reason: 'Can add items to the right-click menu',
    recommendation: undefined,
  },
  {
    permission: 'alarms',
    severity: 'low',
    reason: 'Can schedule background tasks',
    recommendation: undefined,
  },
  {
    permission: 'runtime',
    severity: 'low',
    reason: 'Basic extension messaging',
    recommendation: undefined,
  },
  {
    permission: 'idle',
    severity: 'low',
    reason: 'Can detect when the user is idle',
    recommendation: undefined,
  },
  {
    permission: 'unlimitedStorage',
    severity: 'low',
    reason: 'Can use unlimited local storage',
    recommendation: undefined,
  },
  {
    permission: 'identity',
    severity: 'low',
    reason: 'Can use OAuth2 for authentication',
    recommendation: undefined,
  },
  {
    permission: 'fontSettings',
    severity: 'low',
    reason: 'Can read and modify font settings',
    recommendation: undefined,
  },
  {
    permission: 'tts',
    severity: 'low',
    reason: 'Can use text-to-speech',
    recommendation: undefined,
  },
  {
    permission: 'power',
    severity: 'low',
    reason: 'Can prevent system from sleeping',
    recommendation: undefined,
  },
  {
    permission: 'offscreen',
    severity: 'low',
    reason: 'Can create offscreen documents',
    recommendation: undefined,
  },
  {
    permission: 'sidePanel',
    severity: 'low',
    reason: 'Can use the browser side panel',
    recommendation: undefined,
  },
  {
    permission: 'scripting',
    severity: 'medium',
    reason: 'Can inject scripts into web pages',
    recommendation: 'Limit to specific hosts rather than broad patterns',
  },
  {
    permission: 'tabGroups',
    severity: 'low',
    reason: 'Can organize tabs into groups',
    recommendation: undefined,
  },
  {
    permission: 'favicon',
    severity: 'low',
    reason: 'Can access site favicons',
    recommendation: undefined,
  },
  {
    permission: 'search',
    severity: 'low',
    reason: 'Can trigger searches via the default search engine',
    recommendation: undefined,
  },
  {
    permission: 'sessions',
    severity: 'low',
    reason: 'Can query and restore tabs and windows from browsing sessions',
    recommendation: undefined,
  },
];

// Build a lookup map for fast access
const PERMISSIONS_MAP = new Map<string, PermissionEntry>();
for (const entry of entries) {
  PERMISSIONS_MAP.set(entry.permission, entry);
}

export function getPermissionEntry(permission: string): PermissionEntry | undefined {
  return PERMISSIONS_MAP.get(permission);
}

export function getPermissionSeverity(permission: string): Severity | undefined {
  return PERMISSIONS_MAP.get(permission)?.severity;
}

export function getAllPermissionEntries(): PermissionEntry[] {
  return [...entries];
}

// ── Dangerous Combos ──

export const COMBO_RULES: ComboRule[] = [
  {
    permissions: ['tabs', '<all_urls>'],
    extraPenalty: 10,
    reason: 'Tabs + all_urls enables full browsing surveillance',
  },
  {
    permissions: ['tabs', '*://*/*'],
    extraPenalty: 10,
    reason: 'Tabs + wildcard hosts enables full browsing surveillance',
  },
  {
    permissions: ['webRequest', 'webRequestBlocking'],
    extraPenalty: 10,
    reason: 'Can intercept and modify ALL network requests',
  },
  {
    permissions: ['cookies', '<all_urls>'],
    extraPenalty: 10,
    reason: 'Can steal cookies from any website — session hijacking risk',
  },
  {
    permissions: ['cookies', '*://*/*'],
    extraPenalty: 10,
    reason: 'Can steal cookies from any website — session hijacking risk',
  },
  {
    permissions: ['management'],
    extraPenalty: 7,
    reason: 'Extension management combined with other high-risk permissions — can weaponize other extensions',
    // This rule is special: it fires when management is paired with any other high-risk perm
  },
];

/**
 * Check which combo rules are triggered by the given set of permissions.
 * The management combo fires if management + any other high-risk permission is present.
 */
export function getTriggeredCombos(allPermissions: string[]): ComboRule[] {
  const permSet = new Set(allPermissions);
  const triggered: ComboRule[] = [];

  for (const rule of COMBO_RULES) {
    if (rule.permissions.length === 1 && rule.permissions[0] === 'management') {
      // Special case: management + any other high-risk permission
      if (permSet.has('management')) {
        const hasOtherHighRisk = allPermissions.some(
          (p) => p !== 'management' && getPermissionSeverity(p) === 'high'
        );
        if (hasOtherHighRisk) {
          triggered.push(rule);
        }
      }
    } else {
      // Standard combo: all permissions must be present
      if (rule.permissions.every((p) => permSet.has(p))) {
        triggered.push(rule);
      }
    }
  }

  return triggered;
}
