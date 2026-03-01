import { Hono } from 'hono';
import type { Bindings } from '../types';
import { scanExtension } from '../services/scanner';
import { getCachedReport, cacheReport } from '../services/cache';

const EXTENSION_ID_RE = /^[a-z]{32}$/;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const reportRoutes = new Hono<{ Bindings: Bindings }>();

reportRoutes.get('/:extension_id', async (c) => {
  const extensionId = c.req.param('extension_id');

  if (!EXTENSION_ID_RE.test(extensionId)) {
    return c.json({ error: 'Invalid extension_id. Must be 32 lowercase letters.', code: 400 }, 400);
  }

  // ── Check cache ──
  const cached = await getCachedReport(extensionId, c.env);

  if (cached) {
    const scannedAt = new Date(cached.scanned_at).getTime();
    const age = Date.now() - scannedAt;

    if (age < TWENTY_FOUR_HOURS_MS) {
      return c.json(cached);
    }
  }

  // ── Fresh scan ──
  try {
    const report = await scanExtension(extensionId);
    await cacheReport(report, c.env);
    return c.json(report);
  } catch {
    return c.json({ error: 'Extension not found or scan failed.', code: 404 }, 404);
  }
});
