import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_SEARCH_PATHS = [
  './manifest.json',
  './src/manifest.json',
  './extension/manifest.json',
  './public/manifest.json',
  './chrome/manifest.json',
];

export function findManifestPath(customPath?: string): string {
  if (customPath && customPath.length > 0) {
    const resolved = path.resolve(customPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Manifest not found at custom path: ${resolved}`);
    }
    return resolved;
  }

  for (const searchPath of DEFAULT_SEARCH_PATHS) {
    const resolved = path.resolve(searchPath);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const searched = DEFAULT_SEARCH_PATHS.map((p) => `  - ${path.resolve(p)}`).join('\n');
  throw new Error(
    `Could not find manifest.json in any of the default locations:\n${searched}\n\nPlease specify the path using the 'manifest-path' input.`,
  );
}
