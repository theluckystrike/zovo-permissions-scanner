import { describe, it, expect } from 'vitest';
import { scanManifest } from '../src/scanner';
import { ChromeManifest, ScanReport } from '../src/types';

import minimal from './fixtures/minimal.json';
import moderate from './fixtures/moderate.json';
import dangerous from './fixtures/dangerous.json';
import optimal from './fixtures/optimal.json';

describe('scanManifest', () => {
  it('returns a complete ScanReport matching the JSON schema', () => {
    const report = scanManifest(minimal as ChromeManifest);

    // Required fields
    expect(report).toHaveProperty('extension_id');
    expect(report).toHaveProperty('name');
    expect(report).toHaveProperty('version');
    expect(report).toHaveProperty('score');
    expect(report).toHaveProperty('grade');
    expect(report).toHaveProperty('label');
    expect(report).toHaveProperty('color');
    expect(report).toHaveProperty('permissions');
    expect(report).toHaveProperty('risks');
    expect(report).toHaveProperty('bonuses');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('scanned_at');
    expect(report).toHaveProperty('scanner_version');

    // Permissions sub-fields
    expect(report.permissions).toHaveProperty('required');
    expect(report.permissions).toHaveProperty('optional');
    expect(report.permissions).toHaveProperty('host_permissions');
    expect(report.permissions).toHaveProperty('content_scripts_matches');

    // Types
    expect(typeof report.score).toBe('number');
    expect(typeof report.grade).toBe('string');
    expect(typeof report.summary).toBe('string');
    expect(Array.isArray(report.risks)).toBe(true);
    expect(Array.isArray(report.bonuses)).toBe(true);
  });

  it('sets extension_id from options', () => {
    const report = scanManifest(minimal as ChromeManifest, {
      extensionId: 'abc123',
    });
    expect(report.extension_id).toBe('abc123');
  });

  it('defaults extension_id to empty string', () => {
    const report = scanManifest(minimal as ChromeManifest);
    expect(report.extension_id).toBe('');
  });

  it('extracts name and version from manifest', () => {
    const report = scanManifest(moderate as ChromeManifest);
    expect(report.name).toBe('Tab Manager Pro');
    expect(report.version).toBe('2.1.0');
  });

  it('generates a human-readable summary', () => {
    const report = scanManifest(dangerous as ChromeManifest);
    expect(report.summary.length).toBeGreaterThan(20);
    expect(typeof report.summary).toBe('string');
  });

  it('includes ISO timestamp in scanned_at', () => {
    const report = scanManifest(minimal as ChromeManifest);
    expect(() => new Date(report.scanned_at)).not.toThrow();
    expect(report.scanned_at).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('includes scanner version', () => {
    const report = scanManifest(minimal as ChromeManifest);
    expect(report.scanner_version).toBe('1.0.0');
  });

  it('throws on invalid manifest', () => {
    expect(() => scanManifest({} as ChromeManifest)).toThrow();
    expect(() => scanManifest({ manifest_version: 4 } as unknown as ChromeManifest)).toThrow();
  });

  // Integration: validate each fixture matches expected grade range
  it('minimal fixture → Grade A+', () => {
    const report = scanManifest(minimal as ChromeManifest);
    expect(report.grade).toBe('A+');
    expect(report.score).toBeGreaterThanOrEqual(95);
  });

  it('moderate fixture → Grade A or B (score 78-90)', () => {
    const report = scanManifest(moderate as ChromeManifest);
    expect(report.score).toBeGreaterThanOrEqual(78);
    expect(report.score).toBeLessThanOrEqual(90);
    expect(['A', 'B']).toContain(report.grade);
  });

  it('dangerous fixture → Grade C or D (score ≤ 50)', () => {
    const report = scanManifest(dangerous as ChromeManifest);
    expect(report.score).toBeLessThanOrEqual(50);
    expect(['C', 'D']).toContain(report.grade);
  });

  it('optimal fixture → Grade A+ (score ≥ 90)', () => {
    const report = scanManifest(optimal as ChromeManifest);
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.grade).toBe('A+');
  });

  // Risk details
  it('dangerous extension has risks with correct structure', () => {
    const report = scanManifest(dangerous as ChromeManifest);

    expect(report.risks.length).toBeGreaterThan(0);
    for (const risk of report.risks) {
      expect(risk).toHaveProperty('permission');
      expect(risk).toHaveProperty('severity');
      expect(risk).toHaveProperty('reason');
      expect(['critical', 'high', 'medium', 'low']).toContain(risk.severity);
    }
  });

  // Bonus details
  it('optimal extension has bonuses with correct structure', () => {
    const report = scanManifest(optimal as ChromeManifest);

    expect(report.bonuses.length).toBeGreaterThan(0);
    for (const bonus of report.bonuses) {
      expect(bonus).toHaveProperty('type');
      expect(bonus).toHaveProperty('reason');
    }
  });

  // MV2 support
  it('handles MV2 manifests correctly', () => {
    const mv2: ChromeManifest = {
      manifest_version: 2,
      name: 'MV2 Extension',
      version: '1.0.0',
      permissions: ['tabs', 'https://example.com/*'],
    };
    const report = scanManifest(mv2);

    expect(report.permissions.required).toContain('tabs');
    expect(report.permissions.host_permissions).toContain('https://example.com/*');
    expect(report.permissions.required).not.toContain('https://example.com/*');
  });

  // Content scripts
  it('detects content script match patterns', () => {
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name: 'Content Injector',
      version: '1.0.0',
      permissions: ['storage'],
      content_scripts: [
        { matches: ['https://example.com/*', 'https://test.com/*'] },
      ],
    };
    const report = scanManifest(manifest);

    expect(report.permissions.content_scripts_matches).toContain('https://example.com/*');
    expect(report.permissions.content_scripts_matches).toContain('https://test.com/*');
  });
});
