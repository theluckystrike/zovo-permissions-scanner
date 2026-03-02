import { Hono } from 'hono';
import type { Bindings, CompareResponse } from '../types';
import { scanExtension } from '../services/scanner';
import { getCachedReport, cacheReport } from '../services/cache';

const EXTENSION_ID_RE = /^[a-z]{32}$/;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60;

export const compareRoutes = new Hono<{ Bindings: Bindings }>();

/**
 * Get a report from cache or fresh scan.
 */
async function getOrScan(extensionId: string, env: Bindings) {
  const cached = await getCachedReport(extensionId, env);
  if (cached) {
    const age = Date.now() - new Date(cached.scanned_at).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) return cached;
  }
  const report = await scanExtension(extensionId);
  await cacheReport(report, env);
  return report;
}

compareRoutes.get('/:id1/:id2', async (c) => {
  const id1 = c.req.param('id1');
  const id2 = c.req.param('id2');

  // ── Validate both IDs ──
  if (!EXTENSION_ID_RE.test(id1)) {
    return c.json({ error: `Invalid extension_id "${id1}". Must be 32 lowercase letters.`, code: 400 }, 400);
  }

  if (!EXTENSION_ID_RE.test(id2)) {
    return c.json({ error: `Invalid extension_id "${id2}". Must be 32 lowercase letters.`, code: 400 }, 400);
  }

  // ── Reject self-comparison ──
  if (id1 === id2) {
    return c.json({ error: 'Cannot compare an extension with itself.', code: 400 }, 400);
  }

  // ── Rate limiting ──
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  const rateLimitKey = `rate:${ip}`;
  const currentCount = await c.env.SCAN_CACHE.get(rateLimitKey);
  const count = currentCount ? parseInt(currentCount, 10) : 0;

  if (count >= RATE_LIMIT_MAX) {
    return c.json({ error: 'Rate limit exceeded. Max 10 requests per minute.', code: 429 }, 429);
  }

  await c.env.SCAN_CACHE.put(rateLimitKey, String(count + 2), { expirationTtl: RATE_LIMIT_WINDOW });

  // ── Scan both in parallel (with cache) ──
  let report1, report2;
  try {
    [report1, report2] = await Promise.all([
      getOrScan(id1, c.env),
      getOrScan(id2, c.env),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'One or both scans failed.';
    return c.json({ error: message, code: 500 }, 500);
  }

  // ── Build comparison ──
  const scoreDiff = Math.abs(report1.score - report2.score);
  const winnerId = report1.score >= report2.score ? report1.extension_id : report2.extension_id;
  const loserId = winnerId === report1.extension_id ? report2.extension_id : report1.extension_id;

  const summary =
    scoreDiff === 0
      ? `Both extensions scored ${report1.score}/100 — it's a tie.`
      : `${winnerId} scores ${scoreDiff} points higher than ${loserId}.`;

  const response: CompareResponse = {
    extensions: [report1, report2],
    comparison: {
      winner_id: winnerId,
      score_diff: scoreDiff,
      summary,
    },
  };

  return c.json(response);
});
