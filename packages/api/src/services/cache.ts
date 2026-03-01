import type { ScanReport } from '@zovo/permissions-scanner';
import type { Bindings } from '../types';

/**
 * Retrieve a cached scan report from Cloudflare KV.
 */
export async function getCachedReport(
  extensionId: string,
  env: Bindings
): Promise<ScanReport | null> {
  const key = `report:${extensionId}`;
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
 * Cache a scan report in Cloudflare KV (24h TTL) and optionally
 * persist to Supabase for long-term storage.
 */
export async function cacheReport(
  report: ScanReport,
  env: Bindings
): Promise<void> {
  const key = `report:${report.extension_id}`;

  // Store in KV with 24-hour TTL
  await env.SCAN_CACHE.put(key, JSON.stringify(report), {
    expirationTtl: 86400,
  });

  // Persist to Supabase if credentials available
  if (env.SUPABASE_URL && env.SUPABASE_KEY) {
    const row = {
      extension_id: report.extension_id,
      name: report.name,
      version: report.version,
      score: report.score,
      grade: report.grade,
      label: report.label,
      report: report,
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
      // Best-effort — don't fail the request
    }
  }
}
