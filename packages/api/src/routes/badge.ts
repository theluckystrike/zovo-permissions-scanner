import { Hono } from 'hono';
import type { Bindings, BadgeStyle } from '../types';
import { scanExtension } from '../services/scanner';
import { getCachedReport, cacheReport } from '../services/cache';
import { generateBadge } from '../badge-generator';

const EXTENSION_ID_RE = /^[a-z]{32}$/;
const VALID_STYLES = new Set<BadgeStyle>(['flat', 'plastic', 'for-the-badge']);

export const badgeRoutes = new Hono<{ Bindings: Bindings }>();

badgeRoutes.get('/:extension_id', async (c) => {
  const extensionId = c.req.param('extension_id');

  if (!EXTENSION_ID_RE.test(extensionId)) {
    return c.json({ error: 'Invalid extension_id. Must be 32 lowercase letters.', code: 400 }, 400);
  }

  // ── Parse style ──
  const styleParam = (c.req.query('style') ?? 'flat') as BadgeStyle;
  const style: BadgeStyle = VALID_STYLES.has(styleParam) ? styleParam : 'flat';

  // ── Get report (cache or fresh) ──
  let report = await getCachedReport(extensionId, c.env);

  if (!report) {
    try {
      report = await scanExtension(extensionId);
      await cacheReport(report, c.env);
    } catch {
      return c.json({ error: 'Extension not found or scan failed.', code: 404 }, 404);
    }
  }

  // ── Generate SVG badge ──
  const svg = generateBadge(report, style);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
