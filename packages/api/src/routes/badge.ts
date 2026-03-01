import { Hono } from 'hono';
import type { Bindings, BadgeStyle, ApiError } from '../types';
import { getCachedReport, cacheReport } from '../services/cache';
import { scanExtension } from '../services/scanner';
import { generateBadge } from '../badge-generator';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const VALID_STYLES: BadgeStyle[] = ['flat', 'plastic', 'for-the-badge'];

const badgeRoute = new Hono<{ Bindings: Bindings }>();

/**
 * GET /badge/:extension_id
 * Returns an SVG badge showing the extension's privacy grade.
 * Supports ?style=flat|plastic|for-the-badge (default: flat)
 */
badgeRoute.get('/:extension_id', async (c) => {
  const extensionId = c.req.param('extension_id');

  if (!extensionId || !/^[a-z]{32}$/.test(extensionId)) {
    const err: ApiError = { error: 'Invalid extension_id format. Expected 32 lowercase letters.', code: 400 };
    return c.json(err, 400);
  }

  // ── Parse style query param ──
  const styleParam = (c.req.query('style') ?? 'flat') as BadgeStyle;
  const style: BadgeStyle = VALID_STYLES.includes(styleParam) ? styleParam : 'flat';

  // ── Get or Generate Report ──
  let report;

  try {
    const cached = await getCachedReport(extensionId, c.env);

    if (cached) {
      const scannedAt = new Date(cached.scanned_at).getTime();
      const age = Date.now() - scannedAt;

      if (age < CACHE_MAX_AGE_MS) {
        report = cached;
      }
    }
  } catch {
    // Cache miss — will scan fresh
  }

  if (!report) {
    try {
      report = await scanExtension(extensionId, c.env);
      await cacheReport(report, c.env);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed.';
      const err: ApiError = { error: `Extension not found or scan failed: ${message}`, code: 404 };
      return c.json(err, 404);
    }
  }

  // ── Generate SVG Badge ──
  const svg = generateBadge(report, style);

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

export { badgeRoute };
