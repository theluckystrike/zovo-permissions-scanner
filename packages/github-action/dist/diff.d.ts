import type { ScanReport, Risk, Grade, Severity } from '@zovo/permissions-scanner';
export interface PermissionChange {
    permission: string;
    status: 'added' | 'removed' | 'unchanged';
    severity: Severity | null;
    reason: string;
}
export interface ReportDiff {
    scoreDelta: number;
    gradeBefore: Grade | null;
    gradeAfter: Grade;
    permissionChanges: PermissionChange[];
    newRisks: Risk[];
    removedRisks: Risk[];
    hasChanges: boolean;
}
export declare function diffReports(before: ScanReport | null, after: ScanReport): ReportDiff;
