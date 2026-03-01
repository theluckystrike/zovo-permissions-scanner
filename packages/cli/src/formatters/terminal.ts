import chalk from 'chalk';
import type { ScanReport, Severity, Grade } from '@zovo/permissions-scanner';

// ── Color helpers ──

const gradeColor = (grade: Grade): chalk.Chalk => {
  switch (grade) {
    case 'A+':
    case 'A':
      return chalk.green;
    case 'B':
      return chalk.yellow;
    case 'C':
      return chalk.hex('#FF8800');
    case 'D':
    case 'F':
      return chalk.red;
  }
};

const severityEmoji = (severity: Severity): string => {
  switch (severity) {
    case 'critical':
      return '\u{1F534}';
    case 'high':
      return '\u{1F534}';
    case 'medium':
      return '\u{1F7E1}';
    case 'low':
      return '\u{1F7E2}';
  }
};

const severityLabel = (severity: Severity): string => severity.toUpperCase();

// ── Box-drawing helpers ──

const BOX_WIDTH = 56;

const boxTop = `\u2554${'═'.repeat(BOX_WIDTH)}\u2557`;
const boxBottom = `\u255A${'═'.repeat(BOX_WIDTH)}\u255D`;
const boxRow = (text: string): string => {
  const padding = BOX_WIDTH - text.length;
  return `\u2551  ${text}${' '.repeat(Math.max(0, padding - 2))}\u2551`;
};

const divider = `  ${'─'.repeat(BOX_WIDTH - 2)}`;

// ── Grade emoji ──

const gradeEmoji = (grade: Grade): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return '\u{1F7E2}';
    case 'B':
      return '\u{1F7E1}';
    case 'C':
      return '\u{1F7E0}';
    case 'D':
    case 'F':
      return '\u{1F534}';
  }
};

// ── Main formatter ──

export function formatTerminal(report: ScanReport): string {
  const lines: string[] = [];
  const color = gradeColor(report.grade);

  // Header box
  lines.push('');
  lines.push(chalk.bold(boxTop));
  lines.push(chalk.bold(boxRow('Zovo Permissions Scanner')));
  lines.push(chalk.bold(boxBottom));
  lines.push('');

  // Extension info
  const nameVersion = `${report.name} v${report.version}`;
  lines.push(`  ${chalk.dim('Extension:')}  ${chalk.bold(nameVersion)}`);
  lines.push(`  ${chalk.dim('Score:')}      ${color.bold(`${report.score}/100`)}`);
  lines.push(
    `  ${chalk.dim('Grade:')}      ${color.bold(`${report.grade}`)} ${chalk.dim('\u2014')} ${color(report.label)} ${gradeEmoji(report.grade)}`
  );

  // Risks
  if (report.risks.length > 0) {
    lines.push('');
    lines.push(`  ${chalk.bold.yellow('\u26A0\uFE0F  RISKS FOUND:')}`);
    lines.push('');

    for (const risk of report.risks) {
      const emoji = severityEmoji(risk.severity);
      const label = chalk.bold(severityLabel(risk.severity));
      const reason = risk.reason;
      lines.push(`  ${emoji} ${label}: ${reason}`);

      if (risk.recommendation) {
        lines.push(`     ${chalk.dim('\u2192')} ${chalk.dim(risk.recommendation)}`);
      }

      lines.push('');
    }
  }

  // Bonuses
  if (report.bonuses.length > 0) {
    for (const bonus of report.bonuses) {
      lines.push(`  ${'\u2705'} ${chalk.bold.green('GOOD')}: ${bonus.reason}`);
    }
    lines.push('');
  }

  // Footer
  lines.push(divider);

  const footerParts = ['Scanned by Zovo'];
  if (report.extension_id) {
    footerParts.push(
      `${chalk.dim('https://scan.zovo.dev/report/')}${chalk.cyan(report.extension_id)}`
    );
  } else {
    footerParts.push(chalk.dim('https://zovo.dev'));
  }
  lines.push(`  ${footerParts.join(' \u00B7 ')}`);
  lines.push('');

  return lines.join('\n');
}
