import type { ScanReport, Risk, Severity } from '@zovo/permissions-scanner';
import type { ReportDiff, PermissionChange } from './diff';

// ── Constants ──

const MARKER = '<!-- zovo-permissions-scanner -->';

const GRADE_LABELS: Record<string, string> = {
  'A+': 'Fort Knox',
  A: 'Solid',
  B: 'Mostly Harmless',
  C: 'Eyebrow Raiser',
  D: 'Red Flags',
  F: 'Run.',
};

const GRADE_EMOJIS: Record<string, string> = {
  'A+': '\uD83D\uDFE2',
  A: '\uD83D\uDFE2',
  B: '\uD83D\uDFE1',
  C: '\uD83D\uDFE0',
  D: '\uD83D\uDD34',
  F: '\u26AB',
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '\uD83D\uDD34',
  high: '\uD83D\uDD34',
  medium: '\uD83D\uDFE1',
  low: '\uD83D\uDFE2',
};

const STATUS_ICONS: Record<string, string> = {
  added: '\uD83C\uDD95 Added',
  removed: '\uD83D\uDDD1\uFE0F Removed',
  unchanged: '\u2705 Unchanged',
};

const FOOTER =
  '<sub>\uD83D\uDCE6 Scanned by <a href="https://scan.zovo.one">Zovo Permissions Scanner</a> \u00B7 <a href="https://github.com/theluckystrike/zovo-permissions-scanner">Add to your repo</a></sub>';

const FOOTER_SIMPLE =
  '<sub>\uD83D\uDCE6 Scanned by <a href="https://scan.zovo.one">Zovo Permissions Scanner</a></sub>';

// ── Helpers ──

function severityIcon(severity: Severity | null): string {
  if (severity === null) return '\u26AA';
  return SEVERITY_ICONS[severity] ?? '\u26AA';
}

function scoreDeltaIcon(delta: number): string {
  if (delta > 0) return '\u2B06\uFE0F';
  if (delta < 0) return '\u2B07\uFE0F';
  return '\u27A1\uFE0F';
}

function gradeDisplay(grade: string): string {
  const label = GRADE_LABELS[grade] ?? '';
  const emoji = GRADE_EMOJIS[grade] ?? '';
  return `${grade} (${label} ${emoji})`;
}

function capitalize(value: string | null): string {
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ── Formatters ──

function formatNoChanges(after: ScanReport): string {
  const lines: string[] = [
    MARKER,
    `## \uD83D\uDD0D Zovo Permissions Scanner`,
    '',
    `\u2705 No permission changes detected. Current score: **${after.score}/100 (${after.grade})**`,
    '',
    FOOTER_SIMPLE,
  ];
  return lines.join('\n');
}

function formatWithChanges(after: ScanReport, diff: ReportDiff): string {
  const lines: string[] = [MARKER, `## \uD83D\uDD0D Zovo Permissions Scanner`, ''];

  // Score line
  if (diff.gradeBefore !== null) {
    const scoreBefore = after.score - diff.scoreDelta;
    const icon = scoreDeltaIcon(diff.scoreDelta);
    const sign = diff.scoreDelta >= 0 ? '+' : '';
    lines.push(
      `### Score: ${scoreBefore}/100 \u2192 ${after.score}/100 (${icon} ${sign}${diff.scoreDelta} points)`,
    );
  } else {
    lines.push(`### Score: ${after.score}/100`);
  }

  // Grade line
  if (diff.gradeBefore !== null) {
    lines.push(
      `### Grade: ${diff.gradeBefore} \u2192 ${gradeDisplay(diff.gradeAfter)}`,
    );
  } else {
    lines.push(`### Grade: ${gradeDisplay(diff.gradeAfter)}`);
  }

  lines.push('');

  // Permission changes table
  lines.push(`#### \u26A0\uFE0F Permission Changes Detected`);
  lines.push('');
  lines.push('| Permission | Status | Risk | Impact |');
  lines.push('|-----------|--------|------|--------|');

  for (const change of diff.permissionChanges) {
    const status = STATUS_ICONS[change.status] ?? change.status;
    const risk = severityIcon(change.severity) + ' ' + capitalize(change.severity);
    const impact = change.status === 'unchanged' ? '\u2014' : change.reason;
    lines.push(`| \`${change.permission}\` | ${status} | ${risk} | ${impact} |`);
  }

  lines.push('');

  // New risks
  if (diff.newRisks.length > 0) {
    lines.push(`#### \uD83D\uDCCA New Risks`);
    lines.push('');
    for (const risk of diff.newRisks) {
      lines.push(`- ${severityIcon(risk.severity)} **${risk.reason}**`);
      if (risk.recommendation) {
        lines.push(`- \uD83D\uDCA1 **Recommendation**: ${risk.recommendation}`);
      }
    }
    lines.push('');
  }

  // Positive signals (bonuses)
  if (after.bonuses.length > 0) {
    lines.push(`#### \u2705 Positive Signals`);
    lines.push('');
    for (const bonus of after.bonuses) {
      lines.push(`- ${bonus.reason}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(FOOTER);

  return lines.join('\n');
}

// ── Public API ──

export function formatComment(after: ScanReport, diff: ReportDiff | null): string {
  if (diff === null || !diff.hasChanges) {
    return formatNoChanges(after);
  }
  return formatWithChanges(after, diff);
}

export async function findExistingComment(
  octokit: any,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<number | null> {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });
  const existing = comments.find((c: any) =>
    c.body?.includes('<!-- zovo-permissions-scanner -->'),
  );
  return existing ? existing.id : null;
}
