import * as fs from 'fs';
import * as path from 'path';
import type { BulkScanResult } from '../runner';

/**
 * Export scan results to multiple JSON files.
 * Returns the output directory path.
 */
export function exportToJson(results: BulkScanResult, outputDir: string): string {
  const resolved = path.resolve(outputDir);
  fs.mkdirSync(resolved, { recursive: true });

  // Full scan results
  fs.writeFileSync(
    path.join(resolved, 'scan-results.json'),
    JSON.stringify(results.reports, null, 2),
    'utf-8'
  );

  // Summary with stats
  fs.writeFileSync(
    path.join(resolved, 'summary.json'),
    JSON.stringify(
      {
        stats: results.stats,
        errors: results.errors,
        duration: results.duration,
        scannedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    'utf-8'
  );

  // Wall of Shame — extensions with score < 30 (grade F)
  const wallOfShame = results.reports
    .filter((r) => r.score < 30)
    .sort((a, b) => a.score - b.score)
    .map((r) => ({
      extension_id: r.extension_id,
      name: r.name,
      version: r.version,
      score: r.score,
      grade: r.grade,
      label: r.label,
      risks_count: r.risks.length,
      critical_risks: r.risks.filter((risk) => risk.severity === 'critical').length,
      high_risks: r.risks.filter((risk) => risk.severity === 'high').length,
      scanned_at: r.scanned_at,
    }));

  fs.writeFileSync(
    path.join(resolved, 'wall-of-shame.json'),
    JSON.stringify(wallOfShame, null, 2),
    'utf-8'
  );

  // Leaderboard — all extensions sorted by score descending
  const leaderboard = results.reports
    .sort((a, b) => b.score - a.score)
    .map((r, index) => ({
      rank: index + 1,
      extension_id: r.extension_id,
      name: r.name,
      version: r.version,
      score: r.score,
      grade: r.grade,
      label: r.label,
      risks_count: r.risks.length,
      scanned_at: r.scanned_at,
    }));

  fs.writeFileSync(
    path.join(resolved, 'leaderboard.json'),
    JSON.stringify(leaderboard, null, 2),
    'utf-8'
  );

  return resolved;
}
