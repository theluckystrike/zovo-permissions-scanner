import * as fs from 'fs';
import * as path from 'path';

interface ExtensionEntry {
  id: string;
  name: string;
}

/**
 * Load from the bundled top-extensions.json file.
 */
export function loadTopExtensions(): string[] {
  const filePath = path.resolve(__dirname, '..', 'data', 'top-extensions.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const entries: ExtensionEntry[] = JSON.parse(raw);
  return entries.map((e) => e.id);
}

/**
 * Load extension names from the bundled top-extensions.json keyed by ID.
 */
export function loadExtensionNames(): Record<string, string> {
  const filePath = path.resolve(__dirname, '..', 'data', 'top-extensions.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const entries: ExtensionEntry[] = JSON.parse(raw);
  const map: Record<string, string> = {};
  for (const entry of entries) {
    map[entry.id] = entry.name;
  }
  return map;
}

/**
 * Load extension IDs from a text file (one ID per line).
 * Ignores blank lines and lines starting with #.
 */
export function loadFromFile(filePath: string): string[] {
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/**
 * Parse comma-separated extension IDs.
 */
export function parseIds(idsString: string): string[] {
  return idsString
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}
