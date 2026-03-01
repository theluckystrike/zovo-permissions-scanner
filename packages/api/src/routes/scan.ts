import { Hono } from 'hono';
import type { Bindings, ScanRequest, ApiError } from '../types';
import { scanExtension, scanManifestService } from '../services/scanner';
import { cacheReport } from '../services/cache';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const scanRoute = new Hono<{ Bindings: Bindings }>();

/**
 * POST /scan
 * Accepts { extension_id: string } or { manifest: object }
 * Returns the full ScanReport JSON.
 */
scanRoute.post('/', async (c) => {
  // ── Rate Limiting (simple KV counter per IP) ──
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  const rateKey = `rate:${ip}`;

  try {
    const currentCount = await c.env.SCAN_CACHE.get(rateKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= RATE_LIMIT_MAX) {
      const err: ApiError = { error: 'Rate limit exceeded. Max 10 requests per minute.', code: 429 };
      return c.json(err, 429);
    }

    await c.env.SCAN_CACHE.put(rateKey, String(count + 1), {
      expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch {
    // If KV is unavailable, allow the request through rather than blocking
  }

  // ── Input Validation ──
  let body: ScanRequest;
  try {
    body = await c.req.json<ScanRequest>();
  } catch {
    const err: ApiError = { error: 'Invalid JSON body.', code: 400 };
    return c.json(err, 400);
  }

  const { extension_id, manifest } = body;

  if (!extension_id && !manifest) {
    const err: ApiError = { error: 'Request must include "extension_id" or "manifest".', code: 400 };
    return c.json(err, 400);
  }

  if (extension_id && typeof extension_id !== 'string') {
    const err: ApiError = { error: '"extension_id" must be a string.', code: 400 };
    return c.json(err, 400);
  }

  if (extension_id && !/^[a-z]{32}$/.test(extension_id)) {
    const err: ApiError = { error: 'Invalid extension_id format. Expected 32 lowercase letters.', code: 400 };
    return c.json(err, 400);
  }

  if (manifest && typeof manifest !== 'object') {
    const err: ApiError = { error: '"manifest" must be a valid manifest object.', code: 400 };
    return c.json(err, 400);
  }

  // ── Scan ──
  try {
    const report = extension_id
      ? await scanExtension(extension_id, c.env)
      : await scanManifestService(manifest!, c.env);

    // Cache the result for later retrieval
    await cacheReport(report, c.env);

    return c.json(report, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    const err: ApiError = { error: message, code: 500 };
    return c.json(err, 500);
  }
});

export { scanRoute };
