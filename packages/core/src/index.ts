// Public API
export { scan, scanFromCrx, scanManifest } from './scanner';

// Types
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
} from './types';

// Utilities (for advanced usage)
export { parseManifest, validateManifest } from './manifest-parser';
export { calculateScore, getGradeInfo } from './scoring';
export { getPermissionEntry, getAllPermissionEntries } from './permissions-db';
export { extractManifestFromCrx, downloadCrx } from './crx-extractor';
