import chalk from 'chalk';
import ora from 'ora';
import { scan, scanFromCrx, scanManifest, ScanReport } from '@zovo/permissions-scanner';
import { detectInputType, readManifestFile, readCrxFile } from '../utils';

/**
 * Scan a single target (extension ID, manifest path, or CRX path).
 * Used internally by compareExtensions.
 */
async function scanTarget(input: string): Promise<ScanReport> {
  const inputType = detectInputType(input);

  switch (inputType) {
    case 'manifest': {
      const manifest = readManifestFile(input);
      return scanManifest(manifest);
    }

    case 'crx': {
      const buffer = readCrxFile(input);
      return scanFromCrx(buffer);
    }

    case 'extension_id': {
      return scan(input);
    }
  }
}

/**
 * Compare two extensions side-by-side.
 * Supports extension IDs, manifest paths, and CRX paths (or any mix).
 *
 * With json=true, outputs both reports as a JSON array.
 * Otherwise, outputs a formatted terminal comparison.
 */
export async function compareExtensions(id1: string, id2: string, json: boolean): Promise<void> {
  const spinner = ora('Scanning both extensions for comparison...').start();

  try {
    const [report1, report2] = await Promise.all([
      scanTarget(id1),
      scanTarget(id2),
    ]);

    spinner.succeed('Both extensions scanned successfully');

    if (json) {
      const { formatJson } = await import('../formatters/json');
      process.stdout.write(formatJson([report1, report2]) + '\n');
    } else {
      printComparison(report1, report2);
    }
  } catch (err) {
    spinner.fail('Comparison failed');
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red('\n  Error: ') + message);
    process.exit(1);
  }
}

/**
 * Print a side-by-side terminal comparison of two scan reports.
 */
function printComparison(a: ScanReport, b: ScanReport): void {
  const divider = chalk.gray('─'.repeat(60));

  console.log();
  console.log(chalk.bold('  Extension Comparison'));
  console.log(divider);
  console.log();

  // Names
  const nameA = a.name || a.extension_id || 'Extension A';
  const nameB = b.name || b.extension_id || 'Extension B';

  console.log(chalk.bold('  Name:        ') + chalk.cyan(nameA) + chalk.gray('  vs  ') + chalk.cyan(nameB));
  console.log(chalk.bold('  Version:     ') + a.version + chalk.gray('  vs  ') + b.version);

  // Grades
  const gradeColorA = getGradeChalk(a.grade);
  const gradeColorB = getGradeChalk(b.grade);
  console.log(
    chalk.bold('  Grade:       ') +
      gradeColorA(`${a.grade} (${a.label})`) +
      chalk.gray('  vs  ') +
      gradeColorB(`${b.grade} (${b.label})`)
  );

  // Scores
  console.log(chalk.bold('  Score:       ') + formatScore(a.score) + chalk.gray('  vs  ') + formatScore(b.score));

  console.log();
  console.log(divider);

  // Permission counts
  console.log(chalk.bold('\n  Permissions'));
  console.log(
    `    Required:          ${a.permissions.required.length}` +
      chalk.gray('  vs  ') +
      `${b.permissions.required.length}`
  );
  console.log(
    `    Optional:          ${a.permissions.optional.length}` +
      chalk.gray('  vs  ') +
      `${b.permissions.optional.length}`
  );
  console.log(
    `    Host permissions:   ${a.permissions.host_permissions.length}` +
      chalk.gray('  vs  ') +
      `${b.permissions.host_permissions.length}`
  );

  // Risks
  console.log(chalk.bold('\n  Risks'));
  console.log(
    `    Total:             ${a.risks.length}` + chalk.gray('  vs  ') + `${b.risks.length}`
  );

  const criticalA = a.risks.filter((r) => r.severity === 'critical').length;
  const criticalB = b.risks.filter((r) => r.severity === 'critical').length;
  const highA = a.risks.filter((r) => r.severity === 'high').length;
  const highB = b.risks.filter((r) => r.severity === 'high').length;

  console.log(
    `    Critical:          ${criticalA}` + chalk.gray('  vs  ') + `${criticalB}`
  );
  console.log(
    `    High:              ${highA}` + chalk.gray('  vs  ') + `${highB}`
  );

  console.log();
  console.log(divider);

  // Verdict
  console.log();
  if (a.score === b.score) {
    console.log(chalk.yellow('  Verdict: Both extensions have the same score.'));
  } else if (a.score > b.score) {
    console.log(chalk.green(`  Verdict: ${nameA} is safer (score ${a.score} vs ${b.score}).`));
  } else {
    console.log(chalk.green(`  Verdict: ${nameB} is safer (score ${b.score} vs ${a.score}).`));
  }
  console.log();
}

/**
 * Map a grade letter to a chalk color function.
 */
function getGradeChalk(grade: string): chalk.Chalk {
  switch (grade) {
    case 'A+':
    case 'A':
      return chalk.green;
    case 'B':
      return chalk.blue;
    case 'C':
      return chalk.yellow;
    case 'D':
      return chalk.hex('#FFA500'); // orange
    case 'F':
      return chalk.red;
    default:
      return chalk.white;
  }
}

/**
 * Format a numeric score with color based on value.
 */
function formatScore(score: number): string {
  if (score >= 80) return chalk.green(String(score));
  if (score >= 60) return chalk.yellow(String(score));
  return chalk.red(String(score));
}
