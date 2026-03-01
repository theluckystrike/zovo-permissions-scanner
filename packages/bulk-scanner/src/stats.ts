import type { ScanReport, Grade } from '@zovo/permissions-scanner';

export interface ScanStats {
  total: number;
  successful: number;
  failed: number;
  gradeDistribution: Record<string, number>;
  averageScore: number;
  medianScore: number;
  worstOffenders: { name: string; extensionId: string; score: number; grade: string }[];
  bestExtensions: { name: string; extensionId: string; score: number; grade: string }[];
}

const ALL_GRADES: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];

export function computeStats(reports: ScanReport[], failedCount: number = 0): ScanStats {
  const total = reports.length + failedCount;
  const successful = reports.length;
  const failed = failedCount;

  // Grade distribution — initialize all grades to 0
  const gradeDistribution: Record<string, number> = {};
  for (const g of ALL_GRADES) {
    gradeDistribution[g] = 0;
  }
  for (const report of reports) {
    gradeDistribution[report.grade] = (gradeDistribution[report.grade] ?? 0) + 1;
  }

  // Average score
  const scores = reports.map((r) => r.score);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  // Median score
  const sorted = [...scores].sort((a, b) => a - b);
  let medianScore = 0;
  if (sorted.length > 0) {
    const mid = Math.floor(sorted.length / 2);
    medianScore = sorted.length % 2 === 0
      ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
      : sorted[mid];
  }

  // Worst offenders — lowest scores, top 10
  const sortedByScore = [...reports].sort((a, b) => a.score - b.score);
  const worstOffenders = sortedByScore.slice(0, 10).map((r) => ({
    name: r.name,
    extensionId: r.extension_id,
    score: r.score,
    grade: r.grade,
  }));

  // Best extensions — highest scores, top 10
  const sortedByScoreDesc = [...reports].sort((a, b) => b.score - a.score);
  const bestExtensions = sortedByScoreDesc.slice(0, 10).map((r) => ({
    name: r.name,
    extensionId: r.extension_id,
    score: r.score,
    grade: r.grade,
  }));

  return {
    total,
    successful,
    failed,
    gradeDistribution,
    averageScore,
    medianScore,
    worstOffenders,
    bestExtensions,
  };
}
