import { describe, it, expect } from 'vitest';
import { calculateScore, getGradeInfo } from '../src/scoring';
import { parseManifest } from '../src/manifest-parser';
import { ChromeManifest } from '../src/types';

import minimal from './fixtures/minimal.json';
import moderate from './fixtures/moderate.json';
import dangerous from './fixtures/dangerous.json';
import optimal from './fixtures/optimal.json';
import mv2Moderate from './fixtures/mv2-moderate.json';

describe('getGradeInfo', () => {
  it('returns A+ for score 90-100', () => {
    expect(getGradeInfo(95).grade).toBe('A+');
    expect(getGradeInfo(90).grade).toBe('A+');
    expect(getGradeInfo(100).grade).toBe('A+');
  });

  it('returns A for score 80-89', () => {
    expect(getGradeInfo(80).grade).toBe('A');
    expect(getGradeInfo(89).grade).toBe('A');
  });

  it('returns B for score 70-79', () => {
    expect(getGradeInfo(70).grade).toBe('B');
    expect(getGradeInfo(79).grade).toBe('B');
  });

  it('returns C for score 50-69', () => {
    expect(getGradeInfo(50).grade).toBe('C');
    expect(getGradeInfo(69).grade).toBe('C');
  });

  it('returns D for score 30-49', () => {
    expect(getGradeInfo(30).grade).toBe('D');
    expect(getGradeInfo(49).grade).toBe('D');
  });

  it('returns F for score 0-29', () => {
    expect(getGradeInfo(0).grade).toBe('F');
    expect(getGradeInfo(29).grade).toBe('F');
  });

  it('clamps out-of-range scores', () => {
    expect(getGradeInfo(-10).grade).toBe('F');
    expect(getGradeInfo(150).grade).toBe('A+');
  });
});

describe('calculateScore', () => {
  it('scores minimal extension ≥ 95 (Grade A+)', () => {
    const manifest = minimal as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.grade).toBe('A+');
  });

  it('scores moderate extension 78-90 (Grade A or B)', () => {
    const manifest = moderate as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeGreaterThanOrEqual(78);
    expect(result.score).toBeLessThanOrEqual(90);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('scores dangerous extension ≤ 50 (Grade C or D)', () => {
    const manifest = dangerous as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeLessThanOrEqual(50);
    expect(['C', 'D']).toContain(result.grade);
  });

  it('scores optimal/best-practices extension ≥ 90 (Grade A+)', () => {
    const manifest = optimal as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.grade).toBe('A+');
  });

  it('MV2 manifest scores same as equivalent MV3', () => {
    const mv3Manifest = moderate as ChromeManifest;
    const mv2Manifest = mv2Moderate as ChromeManifest;

    const mv3Parsed = parseManifest(mv3Manifest);
    const mv2Parsed = parseManifest(mv2Manifest);

    const mv3Result = calculateScore(mv3Parsed, mv3Manifest);
    const mv2Result = calculateScore(mv2Parsed, mv2Manifest);

    expect(mv2Result.score).toBe(mv3Result.score);
    expect(mv2Result.grade).toBe(mv3Result.grade);
  });

  it('detects combo penalties for tabs + <all_urls>', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Spy Extension',
      version: '1.0.0',
      permissions: ['tabs'],
      host_permissions: ['<all_urls>'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const comboRisk = result.risks.find((r) => r.permission.includes('+'));
    expect(comboRisk).toBeDefined();
    expect(result.score).toBeLessThan(75);
  });

  it('detects combo penalties for webRequest + webRequestBlocking', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Network Inspector',
      version: '1.0.0',
      permissions: ['webRequest', 'webRequestBlocking'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const comboRisk = result.risks.find((r) =>
      r.permission.includes('webRequest + webRequestBlocking')
    );
    expect(comboRisk).toBeDefined();
  });

  it('awards bonus for activeTab usage', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Click Helper',
      version: '1.0.0',
      permissions: ['activeTab'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const bonus = result.bonuses.find((b) => b.type === 'activeTab');
    expect(bonus).toBeDefined();
  });

  it('awards bonus for optional_permissions', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Opt-in Extension',
      version: '1.0.0',
      permissions: ['storage'],
      optional_permissions: ['history'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const bonus = result.bonuses.find((b) => b.type === 'optional_permissions');
    expect(bonus).toBeDefined();
  });

  it('awards bonus for minimal permissions', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Tiny Extension',
      version: '1.0.0',
      permissions: ['storage'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const bonus = result.bonuses.find((b) => b.type === 'minimal_permissions');
    expect(bonus).toBeDefined();
  });

  it('penalizes wildcard subdomain host patterns', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Wide Host Extension',
      version: '1.0.0',
      permissions: ['storage'],
      host_permissions: ['https://*.google.com/*', 'https://*.facebook.com/*'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    const wildcardRisk = result.risks.find((r) =>
      r.permission.includes('wildcard subdomain')
    );
    expect(wildcardRisk).toBeDefined();
    expect(result.score).toBeLessThan(100);
  });

  it('penalizes many specific host domains', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Many Hosts Extension',
      version: '1.0.0',
      permissions: ['storage'],
      host_permissions: [
        'https://google.com/*',
        'https://facebook.com/*',
        'https://twitter.com/*',
        'https://reddit.com/*',
        'https://youtube.com/*',
      ],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeLessThan(95);
  });

  // ── Credibility tests: legitimate tools should not score F ──

  it('scores a uBlock Origin-like ad blocker above F (diminishing returns)', () => {
    // uBlock Origin needs webRequest, webRequestBlocking, tabs, <all_urls>, etc.
    // for legitimate ad blocking — it should NOT get 0/F
    const manifest: ChromeManifest = {
      manifest_version: 2,
      name: 'uBlock Origin',
      version: '1.50.0',
      permissions: [
        'storage',
        'tabs',
        'webNavigation',
        'webRequest',
        'webRequestBlocking',
        'unlimitedStorage',
        '<all_urls>',
      ],
      homepage_url: 'https://github.com/gorhill/uBlock',
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    // Should score in D range (30-49), NOT F (0-29)
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.grade).not.toBe('F');
  });

  it('scores a Bitwarden-like password manager above F (diminishing returns)', () => {
    // Password managers need cookies, tabs, nativeMessaging, <all_urls>, etc.
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Bitwarden',
      version: '2024.1.0',
      permissions: [
        'storage',
        'tabs',
        'clipboardRead',
        'clipboardWrite',
        'nativeMessaging',
        'unlimitedStorage',
        'activeTab',
        'scripting',
        'offscreen',
        'contextMenus',
        'alarms',
        'idle',
      ],
      host_permissions: ['<all_urls>'],
      optional_permissions: ['notifications'],
      homepage_url: 'https://github.com/bitwarden/clients',
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    // Should score in D or C range, NOT F
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.grade).not.toBe('F');
  });

  it('still gives F to an extension requesting every dangerous permission', () => {
    // An extension with ALL critical + high permissions and no bonuses
    // should still get F — the diminishing returns should not save it
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Mega Spy Tool',
      version: '1.0.0',
      permissions: [
        'debugger',
        'nativeMessaging',
        'proxy',
        'vpnProvider',
        'content_settings',
        'cookies',
        'history',
        'bookmarks',
        'downloads',
        'management',
        'privacy',
        'webRequest',
        'webRequestBlocking',
        'tabs',
        'scripting',
        'notifications',
        'webNavigation',
        'clipboardRead',
        'geolocation',
      ],
      host_permissions: ['<all_urls>'],
      content_scripts: [{ matches: ['<all_urls>'], js: ['inject.js'] }],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.grade).toBe('F');
    expect(result.score).toBeLessThan(30);
  });

  it('clamps final score between 0 and 100', () => {
    // Extension with tons of bad permissions
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Everything Extension',
      version: '1.0.0',
      permissions: [
        'debugger',
        'nativeMessaging',
        'proxy',
        'vpnProvider',
        'content_settings',
        'cookies',
        'history',
        'bookmarks',
        'downloads',
        'management',
        'privacy',
        'webRequest',
        'webRequestBlocking',
        'tabs',
      ],
      host_permissions: ['<all_urls>'],
    };
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBe('F');
  });
});
