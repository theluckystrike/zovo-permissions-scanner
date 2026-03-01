import {
  GradeInfo,
  Grade,
  GradeLabel,
  Risk,
  Bonus,
  ParsedPermissions,
  ChromeManifest,
} from './types';
import {
  RISK_WEIGHTS,
  getPermissionEntry,
  getTriggeredCombos,
} from './permissions-db';
import {
  getAllScoredPermissions,
  countHostDomains,
  detectOpenSource,
  detectPrivacyPolicy,
} from './manifest-parser';

// ── Grade Thresholds ──

const GRADE_TABLE: { min: number; grade: Grade; label: GradeLabel; color: string }[] = [
  { min: 90, grade: 'A+', label: 'Fort Knox', color: '#22c55e' },
  { min: 80, grade: 'A', label: 'Solid', color: '#4ade80' },
  { min: 70, grade: 'B', label: 'Mostly Harmless', color: '#facc15' },
  { min: 50, grade: 'C', label: 'Eyebrow Raiser', color: '#f97316' },
  { min: 30, grade: 'D', label: 'Red Flags', color: '#ef4444' },
  { min: 0, grade: 'F', label: 'Run.', color: '#1f2937' },
];

export function getGradeInfo(score: number): GradeInfo {
  const clamped = Math.max(0, Math.min(100, score));
  for (const entry of GRADE_TABLE) {
    if (clamped >= entry.min) {
      return { grade: entry.grade, label: entry.label, color: entry.color };
    }
  }
  // Fallback (should never reach here)
  return { grade: 'F', label: 'Run.', color: '#1f2937' };
}

// ── Scoring ──

export interface ScoreResult {
  score: number;
  grade: Grade;
  label: GradeLabel;
  color: string;
  risks: Risk[];
  bonuses: Bonus[];
}

const MAX_BONUS = 15;

export function calculateScore(
  parsed: ParsedPermissions,
  manifest: ChromeManifest
): ScoreResult {
  let score = 100;
  const risks: Risk[] = [];
  const bonuses: Bonus[] = [];

  // ── 1. Individual permission penalties ──

  const scoredPerms = getAllScoredPermissions(parsed);

  for (const perm of scoredPerms) {
    const entry = getPermissionEntry(perm);
    if (entry) {
      const weight = RISK_WEIGHTS[entry.severity];
      score -= weight;
      risks.push({
        permission: perm,
        severity: entry.severity,
        reason: entry.reason,
        recommendation: entry.recommendation,
      });
    }
  }

  // ── 2. Combo penalties ──

  const allPermsForCombos = [
    ...scoredPerms,
    ...parsed.host_permissions,
  ];
  const triggeredCombos = getTriggeredCombos(allPermsForCombos);

  for (const combo of triggeredCombos) {
    score -= combo.extraPenalty;
    risks.push({
      permission: combo.permissions.join(' + '),
      severity: 'critical',
      reason: combo.reason,
    });
  }

  // ── 3. Host permission scaling ──

  const hostStats = countHostDomains(parsed.host_permissions);

  if (!hostStats.allUrls) {
    // Only apply host scaling if <all_urls> isn't already counted
    const totalSpecific = hostStats.specific;
    if (totalSpecific >= 10) {
      score -= 10;
      risks.push({
        permission: `${totalSpecific} host domains`,
        severity: 'medium',
        reason: `Requests access to ${totalSpecific} specific domains`,
        recommendation: 'Consider reducing to only essential domains',
      });
    } else if (totalSpecific >= 4) {
      score -= 5;
      risks.push({
        permission: `${totalSpecific} host domains`,
        severity: 'low',
        reason: `Requests access to ${totalSpecific} specific domains`,
        recommendation: 'Consider using optional_host_permissions for less critical domains',
      });
    } else if (totalSpecific >= 1) {
      score -= 2;
    }
  }

  // Wildcard subdomain penalties
  if (hostStats.wildcardSubdomains > 0) {
    const penalty = hostStats.wildcardSubdomains * 5;
    score -= penalty;
    risks.push({
      permission: `${hostStats.wildcardSubdomains} wildcard subdomain pattern(s)`,
      severity: 'medium',
      reason: `Uses wildcard subdomain matching (*.domain) for ${hostStats.wildcardSubdomains} domain(s)`,
      recommendation: 'Specify exact subdomains when possible',
    });
  }

  // Also count content_scripts_matches host stats (non-all_urls ones)
  const csHosts = parsed.content_scripts_matches.filter(
    (m) => !['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*'].includes(m)
  );
  const csWildcards = csHosts.filter((m) => m.includes('*.')).length;
  if (csWildcards > 0) {
    score -= csWildcards * 5;
    risks.push({
      permission: `${csWildcards} content script wildcard pattern(s)`,
      severity: 'medium',
      reason: `Content scripts inject into ${csWildcards} wildcard subdomain pattern(s)`,
      recommendation: 'Limit content script injection to specific domains',
    });
  }

  // ── 4. Bonuses (capped at +15) ──

  let bonusTotal = 0;

  // activeTab instead of tabs + hosts
  const hasActiveTab = parsed.required.includes('activeTab');
  const hasTabs = parsed.required.includes('tabs');
  const hasBroadHosts =
    parsed.host_permissions.some((h) =>
      ['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*'].includes(h)
    );

  if (hasActiveTab && !hasTabs && !hasBroadHosts) {
    const bonus = 5;
    bonusTotal += bonus;
    bonuses.push({
      type: 'activeTab',
      reason: 'Uses activeTab instead of broad host permissions — safer, user-initiated only',
    });
  }

  // optional_permissions
  if (parsed.optional.length > 0) {
    const bonus = 3;
    bonusTotal += bonus;
    bonuses.push({
      type: 'optional_permissions',
      reason: `Uses optional_permissions — asks before accessing ${parsed.optional.join(', ')}`,
    });
  }

  // Privacy policy
  if (detectPrivacyPolicy(manifest)) {
    const bonus = 3;
    bonusTotal += bonus;
    bonuses.push({
      type: 'privacy_policy',
      reason: 'Declares a privacy policy',
    });
  }

  // Minimal permissions
  const totalRequired = parsed.required.length + parsed.host_permissions.length;
  if (totalRequired <= 3) {
    const bonus = 4;
    bonusTotal += bonus;
    bonuses.push({
      type: 'minimal_permissions',
      reason: `Only requests ${totalRequired} permission(s) — minimal footprint`,
    });
  }

  // Open source bonus (not in spec but good signal — counts toward cap)
  if (detectOpenSource(manifest)) {
    const bonus = 2;
    bonusTotal += bonus;
    bonuses.push({
      type: 'open_source',
      reason: 'Homepage points to an open-source repository',
    });
  }

  // Apply capped bonus
  score += Math.min(bonusTotal, MAX_BONUS);

  // ── 5. Clamp final score ──

  score = Math.max(0, Math.min(100, score));

  const gradeInfo = getGradeInfo(score);

  return {
    score,
    ...gradeInfo,
    risks,
    bonuses,
  };
}
