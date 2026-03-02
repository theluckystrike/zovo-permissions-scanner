import * as fs from 'fs';
import * as path from 'path';
import type { ScanReport } from '@zovo/permissions-scanner';

interface ScanResult {
  report: ScanReport;
  extensionMeta: { id: string; name: string; category: string };
}

interface FailedScan {
  id: string;
  name: string;
  error: string;
}

type GradeKey = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

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

function cwsLink(name: string, id: string): string {
  return `[${name}](https://chromewebstore.google.com/detail/${id})`;
}

function worstRisk(report: ScanReport): string {
  // Find the first critical or high risk
  const critical = report.risks.find(r => r.severity === 'critical');
  if (critical) {
    return critical.reason.length > 50 ? critical.reason.slice(0, 47) + '...' : critical.reason;
  }
  const high = report.risks.find(r => r.severity === 'high');
  if (high) {
    return high.reason.length > 50 ? high.reason.slice(0, 47) + '...' : high.reason;
  }
  const any = report.risks[0];
  if (any) {
    return any.reason.length > 50 ? any.reason.slice(0, 47) + '...' : any.reason;
  }
  return '—';
}

function bestTrait(report: ScanReport): string {
  if (report.bonuses.length > 0) {
    return report.bonuses.map(b => b.reason).join(', ');
  }
  return 'Minimal permissions';
}

// --- Generate full-results.json ---
function generateFullResults(results: ScanResult[], failures: FailedScan[]): string {
  const distribution: Record<GradeKey, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of results) {
    const grade = r.report.grade as GradeKey;
    if (grade in distribution) {
      distribution[grade]++;
    }
  }

  return JSON.stringify({
    generated_at: new Date().toISOString(),
    total_scanned: results.length,
    failed: failures.length,
    distribution,
    results: results.map(r => r.report),
  }, null, 2);
}

// --- Generate wall-of-shame.md ---
function generateWallOfShame(results: ScanResult[]): string {
  const sorted = [...results].sort((a, b) => a.report.score - b.report.score);
  const top50 = sorted.slice(0, 50);

  let md = `# 🔴 The Wall of Shame: Chrome's Most Permission-Hungry Extensions\n\n`;
  md += `*Scanned March 2026 by [Zovo Permissions Scanner](https://scan.zovo.one)*\n\n`;
  md += `These are the 50 most popular Chrome extensions with the worst privacy scores.\n`;
  md += `Every extension on this list has millions of users.\n\n`;
  md += `| Rank | Extension | Score | Grade | Worst Risk |\n`;
  md += `|------|-----------|-------|-------|------------|\n`;

  top50.forEach((item, i) => {
    const r = item.report;
    md += `| ${i + 1} | ${cwsLink(r.name, r.extension_id)} | ${r.score}/100 | ${r.grade} ${gradeEmoji(r.grade)} | ${worstRisk(r)} |\n`;
  });

  return md;
}

// --- Generate wall-of-fame.md ---
function generateWallOfFame(results: ScanResult[]): string {
  const sorted = [...results].sort((a, b) => b.report.score - a.report.score);
  const top20 = sorted.slice(0, 20);

  let md = `# 🟢 The Wall of Fame: Chrome's Most Privacy-Respecting Extensions\n\n`;
  md += `*Scanned March 2026 by [Zovo Permissions Scanner](https://scan.zovo.one)*\n\n`;
  md += `These popular extensions prove you don't need invasive permissions to build a great product.\n\n`;
  md += `| Rank | Extension | Score | Grade | Why It's Good |\n`;
  md += `|------|-----------|-------|-------|---------------|\n`;

  top20.forEach((item, i) => {
    const r = item.report;
    md += `| ${i + 1} | ${cwsLink(r.name, r.extension_id)} | ${r.score}/100 | ${r.grade} ${gradeEmoji(r.grade)} | ${bestTrait(r)} |\n`;
  });

  return md;
}

// --- Generate statistics.md ---
function generateStatistics(results: ScanResult[], failures: FailedScan[]): string {
  const total = results.length;
  if (total === 0) return '# No results to analyze.\n';

  const scores = results.map(r => r.report.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);

  const distribution: Record<GradeKey, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of results) {
    const grade = r.report.grade as GradeKey;
    if (grade in distribution) distribution[grade]++;
  }

  const dOrF = distribution.D + distribution.F;
  const dOrFPct = Math.round((dOrF / total) * 100);

  // Count permission usage
  const permCounts: Record<string, number> = {};
  let allUrlsCount = 0;
  let tabsAndHistoryCount = 0;
  let webRequestCount = 0;
  let optionalPermsCount = 0;

  for (const r of results) {
    const allPerms = [
      ...r.report.permissions.required,
      ...r.report.permissions.host_permissions,
    ];

    for (const p of allPerms) {
      permCounts[p] = (permCounts[p] || 0) + 1;
    }

    const hasAllUrls = allPerms.some(p => p === '<all_urls>' || p === '*://*/*' || p === 'http://*/*' || p === 'https://*/*');
    if (hasAllUrls) allUrlsCount++;

    const hasTabs = allPerms.includes('tabs');
    const hasHistory = allPerms.includes('history');
    if (hasTabs && hasHistory) tabsAndHistoryCount++;

    if (allPerms.includes('webRequest') || allPerms.includes('webRequestBlocking')) webRequestCount++;

    if (r.report.permissions.optional.length > 0) optionalPermsCount++;
  }

  const optionalPct = Math.round((optionalPermsCount / total) * 100);

  // Top 5 most common permissions
  const topPerms = Object.entries(permCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let md = `# State of Chrome Extension Privacy — March 2026\n\n`;
  md += `*Analysis of ${total} popular Chrome extensions by [Zovo Permissions Scanner](https://scan.zovo.one)*\n\n`;

  md += `## Key Findings\n\n`;
  md += `- **Average privacy score: ${avgScore}/100** across ${total} popular extensions\n`;
  md += `- **${dOrFPct}% scored D or F** — meaning they request excessive permissions\n`;
  md += `- **${allUrlsCount} extensions** request access to ALL websites (\`<all_urls>\` or \`*://*/*\`)\n`;
  md += `- **${tabsAndHistoryCount} extensions** can read your complete browsing history (\`tabs\` + \`history\`)\n`;
  md += `- **${webRequestCount} extensions** can intercept and modify network requests (\`webRequest\`)\n`;
  md += `- **Only ${optionalPct}%** use optional_permissions (best practice)\n`;

  md += `\n## Most Common Dangerous Permissions\n\n`;
  topPerms.forEach(([perm, count], i) => {
    md += `${i + 1}. \`${perm}\` — found in ${count} extensions (${Math.round((count / total) * 100)}%)\n`;
  });

  md += `\n## Score Distribution\n\n`;
  md += `| Grade | Count | Percentage |\n`;
  md += `|-------|-------|------------|\n`;

  const gradeRanges: Array<[GradeKey, string]> = [
    ['A+', '90-100'], ['A', '80-89'], ['B', '70-79'],
    ['C', '50-69'], ['D', '30-49'], ['F', '0-29'],
  ];

  for (const [grade, range] of gradeRanges) {
    const count = distribution[grade];
    const pct = Math.round((count / total) * 100);
    md += `| ${grade} (${range}) | ${count} | ${pct}% |\n`;
  }

  md += `\n## Failures\n\n`;
  md += `${failures.length} extensions could not be scanned (CWS unavailable, invalid CRX, etc.).\n`;

  return md;
}

/**
 * Generate all report files: full-results.json, wall-of-shame.md,
 * wall-of-fame.md, and statistics.md.
 */
export async function generateAllReports(
  results: ScanResult[],
  failures: FailedScan[],
  outputDir: string,
): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write all reports
  fs.writeFileSync(path.join(outputDir, 'full-results.json'), generateFullResults(results, failures));
  fs.writeFileSync(path.join(outputDir, 'wall-of-shame.md'), generateWallOfShame(results));
  fs.writeFileSync(path.join(outputDir, 'wall-of-fame.md'), generateWallOfFame(results));
  fs.writeFileSync(path.join(outputDir, 'statistics.md'), generateStatistics(results, failures));
}
