import type { ScanReport, Risk, Severity } from '@zovo/permissions-scanner';

const COMMENT_MARKER = '<!-- zovo-permissions-scanner -->';

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: '\uD83D\uDD34 Critical',
  high: '\uD83D\uDFE0 High',
  medium: '\uD83D\uDFE1 Medium',
  low: '\u26AA Low',
};

const GRADE_ICONS: Record<string, string> = {
  'A+': '\uD83D\uDFE2',
  A: '\uD83D\uDFE2',
  B: '\uD83D\uDFE1',
  C: '\uD83D\uDFE0',
  D: '\uD83D\uDD34',
  F: '\uD83D\uDD34',
};

/**
 * Format a ScanReport as a GitHub PR comment in markdown.
 */
export function formatComment(report: ScanReport): string {
  const gradeIcon = GRADE_ICONS[report.grade] ?? '\u26AA';
  const extensionLabel =
    report.name !== 'Unknown Extension'
      ? `${report.name} v${report.version}`
      : `v${report.version}`;

  const lines: string[] = [
    COMMENT_MARKER,
    '',
    '## \uD83D\uDEE1\uFE0F Zovo Permissions Scanner',
    '',
    '| | |',
    '|---|---|',
    `| **Score** | ${report.score}/100 |`,
    `| **Grade** | ${report.grade} \u2014 ${report.label} ${gradeIcon} |`,
    `| **Extension** | ${extensionLabel} |`,
    '',
  ];

  // Risks section
  if (report.risks.length > 0) {
    lines.push('### \u26A0\uFE0F Risks Found', '');
    lines.push('| Severity | Permission | Details |');
    lines.push('|----------|------------|---------|');

    // Sort risks: critical first, then high, medium, low
    const severityOrder: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    const sorted = [...report.risks].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    for (const risk of sorted) {
      const icon = SEVERITY_ICONS[risk.severity];
      lines.push(`| ${icon} | \`${risk.permission}\` | ${risk.reason} |`);
    }

    lines.push('');
  } else {
    lines.push('### \u2705 No Risks Found', '');
    lines.push('This extension uses no risky permissions. Nice!', '');
  }

  // Bonuses section
  if (report.bonuses.length > 0) {
    lines.push('### \u2705 Good Practices', '');
    for (const bonus of report.bonuses) {
      lines.push(`- ${bonus.reason}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(
    '<sub>Scanned by <a href="https://scan.zovo.dev">Zovo Permissions Scanner</a> \u00B7 <a href="https://zovo.dev">zovo.dev</a></sub>'
  );

  return lines.join('\n');
}

/**
 * Find an existing Zovo Permissions Scanner comment on a PR.
 * Returns the comment ID if found, null otherwise.
 */
export async function findExistingComment(
  octokit: ReturnType<typeof import('@actions/github').getOctokit>,
  owner: string,
  repo: string,
  prNumber: number
): Promise<number | null> {
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });

  for (const comment of comments) {
    if (comment.body?.includes(COMMENT_MARKER)) {
      return comment.id;
    }
  }

  return null;
}
