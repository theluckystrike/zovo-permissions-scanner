import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { loadTopExtensions, loadFromFile, parseIds } from './id-sources';
import { bulkScan } from './runner';
import { exportToJson } from './exporters/json-exporter';
import { exportToCsv } from './exporters/csv-exporter';
import type { ScanReport } from '@zovo/permissions-scanner';

const BAR_WIDTH = 18;

/**
 * Get a colored status icon/text based on grade.
 */
function gradeIndicator(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return chalk.green('\u2705');
    case 'B':
      return chalk.green('\u2705');
    case 'C':
      return chalk.yellow('\u26A0\uFE0F');
    case 'D':
      return chalk.red('\uD83D\uDD34');
    case 'F':
      return chalk.red('\uD83D\uDD34');
    default:
      return '';
  }
}

/**
 * Pad a string to a specific width with dots.
 */
function padWithDots(name: string, targetWidth: number): string {
  const maxNameLen = targetWidth - 2;
  const displayName = name.length > maxNameLen ? name.slice(0, maxNameLen) : name;
  const dotsNeeded = targetWidth - displayName.length;
  return displayName + ' ' + '.'.repeat(Math.max(0, dotsNeeded - 1));
}

/**
 * Build a progress bar string.
 */
function buildBar(filled: number, total: number, width: number): string {
  const filledCount = Math.round((filled / Math.max(total, 1)) * width);
  const emptyCount = width - filledCount;
  return '\u2588'.repeat(filledCount) + '\u2591'.repeat(emptyCount);
}

/**
 * Format duration in human-readable form.
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('zovo-bulk-scanner')
    .description('Bulk scan Chrome extensions for the Zovo Wall of Shame')
    .version('1.0.0')
    .option('--ids <ids>', 'Comma-separated extension IDs to scan')
    .option('--file <path>', 'Path to a text file with extension IDs (one per line)')
    .option('--limit <number>', 'Limit the number of extensions to scan', parseInt)
    .option('--output <dir>', 'Output directory for results', './output')
    .option('--delay <ms>', 'Delay between scans in milliseconds', parseInt, 2500);

  program.parse(process.argv);

  const opts = program.opts<{
    ids?: string;
    file?: string;
    limit?: number;
    output: string;
    delay: number;
  }>();

  // Resolve extension IDs
  let extensionIds: string[];

  if (opts.ids) {
    extensionIds = parseIds(opts.ids);
  } else if (opts.file) {
    extensionIds = loadFromFile(opts.file);
  } else {
    extensionIds = loadTopExtensions();
  }

  // Apply limit
  if (opts.limit && opts.limit > 0) {
    extensionIds = extensionIds.slice(0, opts.limit);
  }

  if (extensionIds.length === 0) {
    console.error(chalk.red('No extension IDs provided. Use --ids, --file, or the default list.'));
    process.exit(1);
  }

  // Header
  console.log('');
  console.log(chalk.bold('\uD83D\uDD0D Zovo Bulk Scanner'));
  console.log(chalk.dim('\u2501'.repeat(42)));
  console.log(`Scanning ${chalk.bold(String(extensionIds.length))} extensions...\n`);

  // Run the bulk scan
  const outputDir = path.resolve(opts.output);

  const results = await bulkScan({
    extensionIds,
    delayMs: opts.delay,
    concurrency: 1,
    onProgress: (current: number, total: number, report: ScanReport | null, error?: string) => {
      const indexStr = String(current).padStart(String(total).length, ' ');
      const prefix = `[${indexStr}/${total}]`;

      if (report) {
        const name = padWithDots(report.name, 28);
        const gradeStr = report.grade.padEnd(2);
        const icon = gradeIndicator(report.grade);
        console.log(`${prefix} ${name} ${gradeStr} (${report.score}) ${icon}`);
      } else {
        const id = error
          ? padWithDots(`ID: ${extensionIds[current - 1]}`, 28)
          : padWithDots('Unknown', 28);
        console.log(`${prefix} ${id} ${chalk.red('\u274C')} Error: ${error ?? 'Unknown error'}`);
      }
    },
  });

  // Export results
  exportToJson(results, outputDir);
  const csvPath = exportToCsv(results, outputDir);

  // Summary
  const { stats } = results;

  console.log('');
  console.log(chalk.dim('\u2501'.repeat(42)));
  console.log(chalk.bold('\uD83D\uDCCA Results Summary'));
  console.log(
    `  Total: ${stats.total} | Success: ${chalk.green(String(stats.successful))} | Failed: ${chalk.red(String(stats.failed))}`
  );
  console.log(`  Average Score: ${chalk.bold(String(stats.averageScore))}`);
  console.log(`  Median Score: ${chalk.bold(String(stats.medianScore))}`);
  console.log(`  Duration: ${formatDuration(results.duration)}`);
  console.log('');

  // Grade distribution
  console.log('  Grade Distribution:');
  const gradeOrder = ['A+', 'A', 'B', 'C', 'D', 'F'];
  for (const grade of gradeOrder) {
    const count = stats.gradeDistribution[grade] ?? 0;
    const pct = stats.successful > 0 ? ((count / stats.successful) * 100).toFixed(1) : '0.0';
    const bar = buildBar(count, stats.successful, BAR_WIDTH);
    const gradeLabel = grade.padEnd(2);
    console.log(`  ${gradeLabel} ${bar}  ${count} (${pct}%)`);
  }

  console.log('');

  // Best and worst
  if (stats.bestExtensions.length > 0) {
    const best = stats.bestExtensions[0];
    console.log(
      `  \uD83C\uDFC6 Best: ${best.name} (${best.grade}, ${best.score})`
    );
  }
  if (stats.worstOffenders.length > 0) {
    const worst = stats.worstOffenders[0];
    console.log(
      `  \uD83D\uDC80 Worst: ${worst.name} (${worst.grade}, ${worst.score})`
    );
  }

  console.log('');
  console.log(`  Output: ${path.join(outputDir, 'scan-results.json')}`);
  console.log(`  Output: ${csvPath}`);
  console.log(`  Output: ${path.join(outputDir, 'wall-of-shame.json')}`);
  console.log(`  Output: ${path.join(outputDir, 'leaderboard.json')}`);
  console.log(`  Output: ${path.join(outputDir, 'summary.json')}`);
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
