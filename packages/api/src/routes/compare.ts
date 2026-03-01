import { Hono } from 'hono';
import type { Bindings, CompareResponse, ApiError, ScanReport } from '../types';
import { getCachedReport, cacheReport } from '../services/cache';
import { scanExtension } from '../services/scanner';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const compareRoute = new Hono<{ Bindings: Bindings }>();

/**
 * Retrieve a report from cache or perform a fresh scan.
 */
async function getOrScanReport(extensionId: string, env: Bindings): Promise<ScanReport> {
  try {
    const cached = await getCachedReport(extensionId, env);

    if (cached) {
      const scannedAt = new Date(cached.scanned_at).getTime();
      const age = Date.now() - scannedAt;

      if (age < CACHE_MAX_AGE_MS) {
        return cached;
      }
    }
  } catch {
    // Cache miss — fall through to fresh scan
  }

  const report = await scanExtension(extensionId, env);
  await cacheReport(report, env);
  return report;
}

/**
 * Build a human-readable comparison summary.
 */
function buildSummary(report1: ScanReport, report2: ScanReport): string {
  const diff = Math.abs(report1.score - report2.score);
  const winner = report1.score >= report2.score ? report1 : report2;
  const loser = report1.score >= report2.score ? report2 : report1;

  if (diff === 0) {
    return `Both extensions scored ${report1.score}/100 (Grade ${report1.grade}). They have equivalent privacy profiles.`;
  }

  return (
    `"${winner.name || winner.extension_id}" (Grade ${winner.grade}, ${winner.score}/100) ` +
    `is safer than "${loser.name || loser.extension_id}" (Grade ${loser.grade}, ${loser.score}/100) ` +
    `by ${diff} points. ` +
    `${winner.name || winner.extension_id} has ${winner.risks.length} risk(s), ` +
    `while ${loser.name || loser.extension_id} has ${loser.risks.length} risk(s).`
  );
}

/**
 * GET /compare/:id1/:id2
 * Scans both extensions in parallel and returns a comparison.
 */
compareRoute.get('/:id1/:id2', async (c) => {
  const id1 = c.req.param('id1');
  const id2 = c.req.param('id2');

  // ── Validate both IDs ──
  const idPattern = /^[a-z]{32}$/;

  if (!id1 || !idPattern.test(id1)) {
    const err: ApiError = { error: `Invalid extension_id format for first extension: "${id1}". Expected 32 lowercase letters.`, code: 400 };
    return c.json(err, 400);
  }

  if (!id2 || !idPattern.test(id2)) {
    const err: ApiError = { error: `Invalid extension_id format for second extension: "${id2}". Expected 32 lowercase letters.`, code: 400 };
    return c.json(err, 400);
  }

  if (id1 === id2) {
    const err: ApiError = { error: 'Cannot compare an extension with itself. Provide two different extension IDs.', code: 400 };
    return c.json(err, 400);
  }

  // ── Scan Both in Parallel ──
  let report1: ScanReport;
  let report2: ScanReport;

  try {
    [report1, report2] = await Promise.all([
      getOrScanReport(id1, c.env),
      getOrScanReport(id2, c.env),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Comparison failed.';
    const err: ApiError = { error: `Failed to scan one or both extensions: ${message}`, code: 500 };
    return c.json(err, 500);
  }

  // ── Build Comparison ──
  const winnerId = report1.score >= report2.score ? report1.extension_id : report2.extension_id;
  const scoreDiff = Math.abs(report1.score - report2.score);

  const response: CompareResponse = {
    extensions: [report1, report2],
    comparison: {
      winner_id: winnerId,
      score_diff: scoreDiff,
      summary: buildSummary(report1, report2),
    },
  };

  return c.json(response, 200);
});

export { compareRoute };
