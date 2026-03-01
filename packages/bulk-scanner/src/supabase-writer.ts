import type { ScanReport } from '@zovo/permissions-scanner';

/**
 * Write scan results to Supabase for the Lovable website to consume.
 *
 * Requires SUPABASE_URL and SUPABASE_KEY environment variables.
 * Results are upserted (insert or update on conflict).
 */
export async function writeToSupabase(reports: ScanReport[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_KEY environment variables are required. ' +
      'Use --skip-supabase to skip Supabase persistence.',
    );
  }

  const endpoint = `${supabaseUrl}/rest/v1/scan_reports`;

  // Batch upsert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < reports.length; i += chunkSize) {
    const chunk = reports.slice(i, i + chunkSize);

    const rows = chunk.map(report => ({
      extension_id: report.extension_id,
      name: report.name,
      version: report.version,
      score: report.score,
      grade: report.grade,
      label: report.label,
      report,
      scanned_at: report.scanned_at,
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase upsert failed (${response.status}): ${body}`);
    }
  }
}
