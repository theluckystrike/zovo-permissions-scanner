import type { ScanReport } from '@zovo/permissions-scanner';
import type { ReportDiff } from './diff';
export declare function formatComment(after: ScanReport, diff: ReportDiff | null): string;
export declare function findExistingComment(octokit: any, owner: string, repo: string, prNumber: number): Promise<number | null>;
