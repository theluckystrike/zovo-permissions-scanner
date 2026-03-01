import type { ScanReport } from '@zovo/permissions-scanner';
import type { Bindings } from '../types';

/** KV key prefix for cached scan reports. */
const KEY_PREFIX = 'report:';

/** Cache TTL in seconds (24 hours). */
const TTL_SECONDS = 86_400;

/**
 * Retrieve a cached scan report from Cloudflare KV.
 *
 * @param extensionId  32-character Chrome Web Store extension ID.
 * @param env          Cloudflare Worker bindings (KV + secrets).
 * @returns            The cached {@link ScanReport}, or `null` if not found / unparseable.
 */
export async function getCachedReport(
  extensionId: string,
  env: Bindings,
): Promise<ScanReport | null> {
  const key = `${KEY_PREFIX}${extensionId}`;
  const raw = await env.SCAN_CACHE.get(key);

  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as ScanReport;
  } catch {
    return null;
  }
}

/**
 * Cache a scan report in Cloudflare KV (24 h TTL) and optionally
 * persist to Supabase for long-term storage.
 *
 * Supabase persistence is best-effort -- a failure there will never
 * reject the returned promise.
 *
 * @param report  The scan report to store.
 * @param env     Cloudflare Worker bindings (KV + secrets).
 */
export async function cacheReport(
  report: ScanReport,
  env: Bindings,
): Promise<void> {
  const key = `${KEY_PREFIX}${report.extension_id}`;

  // ── KV (primary cache) ──
  await env.SCAN_CACHE.put(key, JSON.stringify(report), {
    expirationTtl: TTL_SECONDS,
  });

  // ── Supabase (optional long-term persistence) ──
  if (env.SUPABASE_URL && env.SUPABASE_KEY) {
    const row = {
      extension_id: report.extension_id,
      name: report.name,
      version: report.version,
      score: report.score,
      grade: report.grade,
      label: report.label,
      report,
      scanned_at: report.scanned_at,
    };

    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/scan_reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_KEY,
          Authorization: `Bearer ${env.SUPABASE_KEY}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(row),
      });
    } catch {
      // Best-effort -- don't fail the request if Supabase is unreachable.
    }
  }
}
