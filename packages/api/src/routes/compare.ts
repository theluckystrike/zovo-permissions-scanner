import { Hono } from 'hono';
import type { Bindings, CompareResponse } from '../types';
import { scanExtension } from '../services/scanner';

const EXTENSION_ID_RE = /^[a-z]{32}$/;

export const compareRoutes = new Hono<{ Bindings: Bindings }>();

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

  // ── Scan both in parallel ──
  let report1, report2;
  try {
    [report1, report2] = await Promise.all([
      scanExtension(id1),
      scanExtension(id2),
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
