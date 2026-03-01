import { Hono } from 'hono';
import type { Bindings, ApiError } from '../types';
import { getCachedReport, cacheReport } from '../services/cache';
import { scanExtension } from '../services/scanner';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const reportRoute = new Hono<{ Bindings: Bindings }>();

/**
 * GET /report/:extension_id
 * Returns the ScanReport for the given extension.
 * Serves from cache if the report is less than 24 hours old.
 */
reportRoute.get('/:extension_id', async (c) => {
  const extensionId = c.req.param('extension_id');

  if (!extensionId || !/^[a-z]{32}$/.test(extensionId)) {
    const err: ApiError = { error: 'Invalid extension_id format. Expected 32 lowercase letters.', code: 400 };
    return c.json(err, 400);
  }

  // ── Check Cache ──
  try {
    const cached = await getCachedReport(extensionId, c.env);

    if (cached) {
      const scannedAt = new Date(cached.scanned_at).getTime();
      const age = Date.now() - scannedAt;

      if (age < CACHE_MAX_AGE_MS) {
        return c.json(cached, 200);
      }
    }
  } catch {
    // Cache miss or error — proceed with fresh scan
  }

  // ── Fresh Scan ──
  try {
    const report = await scanExtension(extensionId, c.env);
    await cacheReport(report, c.env);
    return c.json(report, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    const err: ApiError = { error: `Extension not found or scan failed: ${message}`, code: 404 };
    return c.json(err, 404);
  }
});

export { reportRoute };
