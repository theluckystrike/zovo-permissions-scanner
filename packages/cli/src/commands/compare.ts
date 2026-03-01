import chalk from 'chalk';
import ora from 'ora';
import { scan, scanFromCrx, scanManifest, ScanReport } from '@zovo/permissions-scanner';
import { detectInputType, readManifestFile, readCrxFile } from '../utils';
import { formatTerminal } from '../formatters/terminal';
import { formatJson } from '../formatters/json';

async function scanTarget(target: string): Promise<ScanReport> {
  const inputType = detectInputType(target);

  if (inputType === 'manifest') {
    const manifest = readManifestFile(target);
    return scanManifest(manifest);
  } else if (inputType === 'crx') {
    const buffer = readCrxFile(target);
    return scanFromCrx(buffer);
  } else {
    return scan(target);
  }
}

function severityColor(severity: string): chalk.Chalk {
  switch (severity) {
    case 'critical':
      return chalk.red;
    case 'high':
      return chalk.redBright;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.green;
    default:
      return chalk.white;
  }
}

function gradeColor(grade: string): chalk.Chalk {
  switch (grade) {
    case 'A+':
    case 'A':
      return chalk.green;
    case 'B':
      return chalk.cyan;
    case 'C':
      return chalk.yellow;
    case 'D':
      return chalk.redBright;
    case 'F':
      return chalk.red;
    default:
      return chalk.white;
  }
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.substring(0, len);
  return str + ' '.repeat(len - str.length);
}

function printComparisonTable(report1: ScanReport, report2: ScanReport): void {
  const colWidth = 36;
  const sep = ' | ';
  const divider = '-'.repeat(colWidth) + '-+-' + '-'.repeat(colWidth);

  const name1 = report1.name || report1.extension_id || 'Extension 1';
  const name2 = report2.name || report2.extension_id || 'Extension 2';

  console.log('');
  console.log(chalk.bold('  Permission Comparison'));
  console.log('');
  console.log(
    chalk.bold(padRight(`  ${name1}`, colWidth)) +
      sep +
      chalk.bold(padRight(name2, colWidth))
  );
  console.log(`  ${divider}`);

  // Grade row
  console.log(`  ${padRight('Grade:', colWidth)}${sep}${padRight('Grade:', colWidth)}`);
  console.log(
    `  ${padRight(`  ${report1.grade} — ${report1.label}`, colWidth)}${sep}${padRight(`  ${report2.grade} — ${report2.label}`, colWidth)}`
  );
  console.log(`  ${divider}`);

  // Score row
  console.log(
    `  ${padRight(`Score: ${report1.score}/100`, colWidth)}${sep}${padRight(`Score: ${report2.score}/100`, colWidth)}`
  );
  console.log(`  ${divider}`);

  // Permissions row
  const perms1 = report1.permissions.required;
  const perms2 = report2.permissions.required;
  const maxPerms = Math.max(perms1.length, perms2.length);

  console.log(
    `  ${padRight(`Permissions (${perms1.length})`, colWidth)}${sep}${padRight(`Permissions (${perms2.length})`, colWidth)}`
  );

  for (let i = 0; i < maxPerms; i++) {
    const p1 = i < perms1.length ? `  ${perms1[i]}` : '';
    const p2 = i < perms2.length ? `  ${perms2[i]}` : '';
    console.log(`  ${padRight(p1, colWidth)}${sep}${padRight(p2, colWidth)}`);
  }
  console.log(`  ${divider}`);

  // Risks row
  const risks1 = report1.risks;
  const risks2 = report2.risks;
  const maxRisks = Math.max(risks1.length, risks2.length);

  console.log(
    `  ${padRight(`Risks (${risks1.length})`, colWidth)}${sep}${padRight(`Risks (${risks2.length})`, colWidth)}`
  );

  for (let i = 0; i < maxRisks; i++) {
    const r1 = i < risks1.length ? `  [${risks1[i].severity}] ${risks1[i].permission}` : '';
    const r2 = i < risks2.length ? `  [${risks2[i].severity}] ${risks2[i].permission}` : '';
    console.log(`  ${padRight(r1, colWidth)}${sep}${padRight(r2, colWidth)}`);
  }

  console.log('');
}

export async function compareExtensions(
  id1: string,
  id2: string,
  json: boolean
): Promise<void> {
  const spinner = ora('Scanning both extensions...').start();

  try {
    const [report1, report2] = await Promise.all([
      scanTarget(id1),
      scanTarget(id2),
    ]);

    spinner.succeed('Both extensions scanned successfully');

    if (json) {
      console.log(formatJson([report1, report2]));
    } else {
      printComparisonTable(report1, report2);
    }
  } catch (error) {
    spinner.fail('Comparison failed');
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}
