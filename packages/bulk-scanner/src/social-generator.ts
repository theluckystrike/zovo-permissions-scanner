import * as fs from 'fs';
import * as path from 'path';
import type { ScanReport } from '@zovo/permissions-scanner';

interface ScanResult {
  report: ScanReport;
  extensionMeta: { id: string; name: string; category: string };
}

/**
 * Generate social media content: Twitter/X thread and HN submission.
 */
export async function generateSocialContent(
  results: ScanResult[],
  outputDir: string,
): Promise<void> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const total = results.length;
  if (total === 0) return;

  const scores = results.map(r => r.report.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);

  // Grade distribution
  const dOrF = results.filter(r => r.report.grade === 'D' || r.report.grade === 'F').length;
  const dOrFPct = Math.round((dOrF / total) * 100);

  // Worst offender
  const sorted = [...results].sort((a, b) => a.report.score - b.report.score);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];

  // Count key permissions
  const allUrlsCount = results.filter(r => {
    const allPerms = [...r.report.permissions.required, ...r.report.permissions.host_permissions];
    return allPerms.some(p => p === '<all_urls>' || p === '*://*/*');
  }).length;

  // --- Twitter/X Thread ---
  let thread = `# Twitter/X Thread — Chrome Extension Privacy Report\n\n`;
  thread += `> Copy each numbered section as a separate tweet.\n\n`;
  thread += `---\n\n`;
  thread += `\u{1F9F5} We scanned the top ${total} Chrome extensions for privacy risks.\n\n`;
  thread += `The results are alarming. Thread \u{1F447}\n\n`;
  thread += `---\n\n`;

  thread += `1/ Average privacy score: ${avgScore}/100\n\n`;
  thread += `${dOrFPct}% of popular extensions request permissions they probably don't need.\n\n`;
  thread += `---\n\n`;

  thread += `2/ The worst offender: ${worst.report.name} with ${worst.report.extension_id}\n`;
  thread += `Score: ${worst.report.score}/100 (${worst.report.grade})\n\n`;
  if (worst.report.risks.length > 0) {
    const topRisks = worst.report.risks.slice(0, 3);
    for (const risk of topRisks) {
      thread += `- ${risk.reason}\n`;
    }
  }
  thread += `\nFor a ${worst.extensionMeta.category} extension. Why?\n\n`;
  thread += `---\n\n`;

  thread += `3/ ${allUrlsCount} out of ${total} extensions request access to ALL your websites.\n\n`;
  thread += `That's ${Math.round((allUrlsCount / total) * 100)}% of popular extensions that can see everything you browse.\n\n`;
  thread += `---\n\n`;

  thread += `4/ The most privacy-respecting extension: ${best.report.name}\n`;
  thread += `Score: ${best.report.score}/100 (${best.report.grade})\n\n`;
  thread += `Proof that you can build a great extension without spying on users.\n\n`;
  thread += `---\n\n`;

  thread += `5/ We built an open-source scanner so you can check any extension yourself.\n\n`;
  thread += `\u{1F517} scan.zovo.one\n`;
  thread += `\u2B50 github.com/theluckystrike/zovo-permissions-scanner\n\n`;
  thread += `Built by @ZovoDev\n`;

  fs.writeFileSync(path.join(outputDir, 'twitter-thread.md'), thread);

  // --- HN Submission ---
  let hn = `# Hacker News Submission\n\n`;
  hn += `**Title:** We scanned ${total} popular Chrome extensions for privacy — ${dOrFPct}% scored D or F\n\n`;
  hn += `**URL:** https://scan.zovo.one/report/top-${total}\n\n`;
  hn += `**Comment to post:**\n\n`;
  hn += `Hey HN,\n\n`;
  hn += `We built an open-source Chrome extension permissions scanner and used it to analyze the top ${total} most popular extensions.\n\n`;
  hn += `Key findings:\n`;
  hn += `- Average privacy score: ${avgScore}/100\n`;
  hn += `- ${dOrFPct}% scored D or F (excessive permissions)\n`;
  hn += `- ${allUrlsCount} extensions request access to ALL websites\n\n`;
  hn += `The scanner is fully open source: https://github.com/theluckystrike/zovo-permissions-scanner\n\n`;
  hn += `You can scan any extension at https://scan.zovo.one\n\n`;
  hn += `Built with TypeScript. The scoring algorithm considers permission severity, dangerous combos, host permission breadth, and rewards extensions that use best practices like optional_permissions.\n\n`;
  hn += `Would love feedback on the scoring methodology.\n`;

  fs.writeFileSync(path.join(outputDir, 'hn-submission.md'), hn);
}
