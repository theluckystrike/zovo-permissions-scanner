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

  it('scores moderate extension 70-85 (Grade B)', () => {
    const manifest = moderate as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(85);
    expect(result.grade).toBe('B');
  });

  it('scores dangerous extension ≤ 30 (Grade F)', () => {
    const manifest = dangerous as ChromeManifest;
    const parsed = parseManifest(manifest);
    const result = calculateScore(parsed, manifest);

    expect(result.score).toBeLessThanOrEqual(30);
    expect(['F', 'D']).toContain(result.grade);
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
    expect(result.score).toBeLessThan(60);
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
    expect(result.score).toBeLessThan(95);
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
