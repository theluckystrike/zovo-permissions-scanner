"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffReports = diffReports;
const permissions_scanner_1 = require("@zovo/permissions-scanner");
// ── Helpers ──
function buildPermissionChange(permission, status) {
    const entry = (0, permissions_scanner_1.getPermissionEntry)(permission);
    return {
        permission,
        status,
        severity: entry?.severity ?? null,
        reason: entry?.reason ?? 'Unknown permission',
    };
}
function diffStringArrays(before, after) {
    const beforeSet = new Set(before);
    const afterSet = new Set(after);
    const changes = [];
    // Added: in after but not in before
    for (const perm of after) {
        if (!beforeSet.has(perm)) {
            changes.push(buildPermissionChange(perm, 'added'));
        }
    }
    // Removed: in before but not in after
    for (const perm of before) {
        if (!afterSet.has(perm)) {
            changes.push(buildPermissionChange(perm, 'removed'));
        }
    }
    // Unchanged: in both
    for (const perm of after) {
        if (beforeSet.has(perm)) {
            changes.push(buildPermissionChange(perm, 'unchanged'));
        }
    }
    return changes;
}
// ── Main Diff Function ──
function diffReports(before, after) {
    // No base branch to compare against (new manifest)
    if (before === null) {
        const allPermissions = [
            ...after.permissions.required,
            ...after.permissions.host_permissions,
        ];
        const permissionChanges = allPermissions.map((perm) => buildPermissionChange(perm, 'added'));
        return {
            scoreDelta: 0,
            gradeBefore: null,
            gradeAfter: after.grade,
            permissionChanges,
            newRisks: [...after.risks],
            removedRisks: [],
            hasChanges: allPermissions.length > 0,
        };
    }
    // Compare before and after reports
    const scoreDelta = after.score - before.score;
    // Diff required permissions and host_permissions separately, then merge
    const requiredChanges = diffStringArrays(before.permissions.required, after.permissions.required);
    const hostChanges = diffStringArrays(before.permissions.host_permissions, after.permissions.host_permissions);
    const permissionChanges = [...requiredChanges, ...hostChanges];
    // Determine new and removed risks by comparing on the permission field
    const beforeRiskPermissions = new Set(before.risks.map((r) => r.permission));
    const afterRiskPermissions = new Set(after.risks.map((r) => r.permission));
    const newRisks = after.risks.filter((r) => !beforeRiskPermissions.has(r.permission));
    const removedRisks = before.risks.filter((r) => !afterRiskPermissions.has(r.permission));
    const hasChanges = permissionChanges.some((c) => c.status === 'added' || c.status === 'removed');
    return {
        scoreDelta,
        gradeBefore: before.grade,
        gradeAfter: after.grade,
        permissionChanges,
        newRisks,
        removedRisks,
        hasChanges,
    };
}
