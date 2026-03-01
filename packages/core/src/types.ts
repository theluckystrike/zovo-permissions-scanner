// ── Risk & Scoring Types ──

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export type GradeLabel =
  | 'Fort Knox'
  | 'Solid'
  | 'Mostly Harmless'
  | 'Eyebrow Raiser'
  | 'Red Flags'
  | 'Run.';

export interface GradeInfo {
  grade: Grade;
  label: GradeLabel;
  color: string;
}

// ── Permission Database Types ──

export interface PermissionEntry {
  permission: string;
  severity: Severity;
  reason: string;
  recommendation?: string;
}

export interface ComboRule {
  permissions: string[];
  extraPenalty: number;
  reason: string;
}

// ── Manifest Types ──

export interface ChromeManifest {
  manifest_version: 2 | 3;
  name?: string;
  version?: string;
  description?: string;
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  optional_host_permissions?: string[];
  content_scripts?: ContentScript[];
  homepage_url?: string;
  [key: string]: unknown;
}

export interface ContentScript {
  matches?: string[];
  js?: string[];
  css?: string[];
  run_at?: string;
  [key: string]: unknown;
}

export interface ParsedPermissions {
  required: string[];
  optional: string[];
  host_permissions: string[];
  content_scripts_matches: string[];
}

// ── Report Types ──

export interface Risk {
  permission: string;
  severity: Severity;
  reason: string;
  recommendation?: string;
}

export interface Bonus {
  type: string;
  reason: string;
}

export interface ScanReport {
  extension_id: string;
  name: string;
  version: string;
  score: number;
  grade: Grade;
  label: GradeLabel;
  color: string;
  permissions: ParsedPermissions;
  risks: Risk[];
  bonuses: Bonus[];
  summary: string;
  scanned_at: string;
  scanner_version: string;
}

// ── Scanner Options ──

export interface ScanOptions {
  /** Override extension ID in the report */
  extensionId?: string;
}
