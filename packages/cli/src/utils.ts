import * as fs from 'fs';
import * as path from 'path';
import { ChromeManifest } from '@zovo/permissions-scanner';

export function detectInputType(input: string): 'manifest' | 'crx' | 'extension_id' {
  if (input.endsWith('.json')) return 'manifest';
  if (input.endsWith('.crx')) return 'crx';
  return 'extension_id';
}

export function readManifestFile(filePath: string): ChromeManifest {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf-8');
  return JSON.parse(content);
}

export function readCrxFile(filePath: string): Buffer {
  const resolved = path.resolve(filePath);
  return fs.readFileSync(resolved);
}
