import type { ScanReport } from '@zovo/permissions-scanner';

export function formatJson(data: ScanReport | ScanReport[]): string {
  return JSON.stringify(data, null, 2);
}
