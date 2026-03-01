import type { ScanReport, ChromeManifest } from '@zovo/permissions-scanner';

// Re-export relevant types from core
export type {
  ScanReport,
  Risk,
  Bonus,
  Grade,
  GradeLabel,
  GradeInfo,
  Severity,
  ChromeManifest,
  ParsedPermissions,
  ScanOptions,
} from '@zovo/permissions-scanner';

// ── Request / Response Types ──

export interface ScanRequest {
  extension_id?: string;
  manifest?: ChromeManifest;
}

export interface CompareResponse {
  extensions: [ScanReport, ScanReport];
  comparison: {
    winner_id: string;
    score_diff: number;
    summary: string;
  };
}

export interface ApiError {
  error: string;
  code: number;
}

// ── Cloudflare Workers Bindings ──

export type Bindings = {
  SCAN_CACHE: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
};

// ── Badge Styles ──

export type BadgeStyle = 'flat' | 'plastic' | 'for-the-badge';
