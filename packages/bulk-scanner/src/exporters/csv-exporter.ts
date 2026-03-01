import * as fs from 'fs';
import * as path from 'path';
import type { BulkScanResult } from '../runner';

/**
 * Escape a CSV field value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export scan results to a CSV file.
 * Returns the output file path.
 */
export function exportToCsv(results: BulkScanResult, outputDir: string): string {
  const resolved = path.resolve(outputDir);
  fs.mkdirSync(resolved, { recursive: true });

  const headers = [
    'extension_id',
    'name',
    'version',
    'score',
    'grade',
    'label',
    'risks_count',
    'critical_risks',
    'high_risks',
    'scanned_at',
  ];

  const rows = results.reports.map((r) => [
    r.extension_id,
    escapeCsvField(r.name),
    r.version,
    String(r.score),
    r.grade,
    escapeCsvField(r.label),
    String(r.risks.length),
    String(r.risks.filter((risk) => risk.severity === 'critical').length),
    String(r.risks.filter((risk) => risk.severity === 'high').length),
    r.scanned_at,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n') + '\n';

  const outputPath = path.join(resolved, 'scan-results.csv');
  fs.writeFileSync(outputPath, csv, 'utf-8');

  return outputPath;
}
