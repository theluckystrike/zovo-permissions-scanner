import { Hono } from 'hono';
import type { Bindings, ScanRequest } from '../types';
import { scanExtension, scanManifestService } from '../services/scanner';
import { cacheReport } from '../services/cache';

const EXTENSION_ID_RE = /^[a-z]{32}$/;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60;

export const scanRoutes = new Hono<{ Bindings: Bindings }>();

scanRoutes.post('/', async (c) => {
  // ── Rate limiting ──
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  const rateLimitKey = `rate:${ip}`;

  const currentCount = await c.env.SCAN_CACHE.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return c.json({ error: 'Rate limit exceeded. Max 10 requests per minute.', code: 429 }, 429);
  }

  await c.env.SCAN_CACHE.put(rateLimitKey, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW });

  // ── Validate body ──
  let body: ScanRequest;
  try {
    body = await c.req.json<ScanRequest>();
  } catch {
    return c.json({ error: 'Invalid JSON body.', code: 400 }, 400);
  }

  const { extension_id, manifest } = body;

  if (!extension_id && !manifest) {
    return c.json({ error: 'Request must include "extension_id" (string) or "manifest" (object).', code: 400 }, 400);
  }

  if (extension_id && typeof extension_id !== 'string') {
    return c.json({ error: '"extension_id" must be a string.', code: 400 }, 400);
  }

  if (extension_id && !EXTENSION_ID_RE.test(extension_id)) {
    return c.json({ error: 'Invalid extension_id. Must be 32 lowercase letters.', code: 400 }, 400);
  }

  if (manifest && typeof manifest !== 'object') {
    return c.json({ error: '"manifest" must be an object.', code: 400 }, 400);
  }

  // ── Scan ──
  try {
    const report = extension_id
      ? await scanExtension(extension_id)
      : scanManifestService(manifest!);

    await cacheReport(report, c.env);

    return c.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed.';
    return c.json({ error: message, code: 500 }, 500);
  }
});
