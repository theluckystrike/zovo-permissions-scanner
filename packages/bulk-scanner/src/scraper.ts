import * as fs from 'fs';
import * as path from 'path';

export interface ExtensionEntry {
  id: string;
  name: string;
  category: string;
}

/**
 * Load the extension list from the seed file.
 * Returns up to `limit` extensions.
 */
export async function loadExtensionList(limit: number = 500): Promise<ExtensionEntry[]> {
  const seedPath = path.resolve(__dirname, '..', 'data', 'seed-extensions.json');

  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

  const raw = fs.readFileSync(seedPath, 'utf-8');
  const extensions: ExtensionEntry[] = JSON.parse(raw);

  // Validate entries
  const valid = extensions.filter(ext => {
    if (!ext.id || typeof ext.id !== 'string' || ext.id.length !== 32) {
      console.warn(`Skipping invalid entry: ${ext.name || 'unknown'} (bad ID: ${ext.id})`);
      return false;
    }
    return true;
  });

  return valid.slice(0, limit);
}
