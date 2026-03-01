import chalk from 'chalk';
import { scan } from '@zovo/permissions-scanner';
import type { ScanReport } from '@zovo/permissions-scanner';
import { delay, withRetry } from './utils/rate-limiter';
import { loadProgress, saveProgress } from './utils/progress';
import type { ScanResult, FailedScan, ProgressData } from './utils/progress';

interface MassScanOptions {
  delayMs: number;
  resume: boolean;
}

interface MassScanResult {
  results: ScanResult[];
  failures: FailedScan[];
}

function gradeEmoji(grade: string): string {
  switch (grade) {
    case 'A+': case 'A': return '🟢';
    case 'B': return '🔵';
    case 'C': return '🟠';
    case 'D': return '🔴';
    case 'F': return '⚫';
    default: return '⚪';
  }
}

/**
 * Scan all extensions with rate limiting, retries, and progress resume.
 */
export async function massScanner(
  extensions: Array<{ id: string; name: string; category: string }>,
  options: MassScanOptions,
): Promise<MassScanResult> {
  const { delayMs, resume } = options;

  // Load existing progress if resuming
  let progress: ProgressData;
  if (resume) {
    progress = loadProgress();
    if (progress.completedIds.size > 0) {
      console.log(chalk.yellow(`  Resuming: ${progress.completedIds.size} already completed, skipping...\n`));
    }
  } else {
    progress = {
      results: [],
      failures: [],
      completedIds: new Set(),
      lastUpdated: new Date().toISOString(),
    };
  }

  const total = extensions.length;
  let scanned = 0;

  for (const ext of extensions) {
    // Skip already-completed extensions when resuming
    if (progress.completedIds.has(ext.id)) {
      continue;
    }

    scanned++;
    const idx = progress.completedIds.size + 1;
    const prefix = chalk.gray(`[${idx}/${total}]`);

    process.stdout.write(`${prefix} Scanning: ${chalk.bold(ext.name)} (${ext.id}) ... `);

    try {
      const report: ScanReport = await withRetry(() => scan(ext.id));

      console.log(
        `Score: ${chalk.bold(String(report.score))} Grade: ${chalk.bold(report.grade)} ${gradeEmoji(report.grade)}`,
      );

      progress.results.push({ report, extensionMeta: ext });
      progress.completedIds.add(ext.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`FAILED: ${errorMsg}`));

      progress.failures.push({
        id: ext.id,
        name: ext.name,
        error: errorMsg,
      });
      progress.completedIds.add(ext.id);
    }

    // Save progress after each scan
    saveProgress(progress);

    // Rate limit delay (skip after last extension)
    if (scanned < total - progress.completedIds.size + scanned) {
      await delay(delayMs);
    }
  }

  return {
    results: progress.results,
    failures: progress.failures,
  };
}
