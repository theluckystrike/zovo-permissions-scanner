# @zovo/permissions-scanner

Chrome extension permissions scanner — privacy/security grading engine.

**Know what your extensions can see.**

Analyzes any Chrome extension's permissions and generates a privacy/security report with a letter grade (A+ to F).

## Installation

```bash
npm install @zovo/permissions-scanner
```

## Usage

```typescript
import { scan, scanFromCrx, scanManifest } from '@zovo/permissions-scanner';

// Scan by Chrome Web Store extension ID
const report = await scan('nkbihfbeogaeaoehlefnkodbefgpgknn');
console.log(report.grade);  // "C"
console.log(report.score);  // 62
console.log(report.label);  // "Eyebrow Raiser"

// Scan from a manifest.json object
const report = scanManifest({
  manifest_version: 3,
  name: "My Extension",
  version: "1.0.0",
  permissions: ["tabs", "storage"],
});

// Scan from a .crx file buffer
const buffer = fs.readFileSync('extension.crx');
const report = await scanFromCrx(buffer);
```

## Output Format

```json
{
  "extension_id": "abc123",
  "name": "Extension Name",
  "version": "1.2.3",
  "score": 72,
  "grade": "B",
  "label": "Mostly Harmless",
  "color": "#facc15",
  "permissions": {
    "required": ["tabs", "storage"],
    "optional": ["history"],
    "host_permissions": ["https://*.google.com/*"],
    "content_scripts_matches": ["https://*.example.com/*"]
  },
  "risks": [
    {
      "permission": "tabs",
      "severity": "medium",
      "reason": "Can see URLs and titles of all open tabs",
      "recommendation": "Consider using activeTab if only current tab needed"
    }
  ],
  "bonuses": [
    {
      "type": "optional_permissions",
      "reason": "Uses optional_permissions for history — asks before accessing"
    }
  ],
  "summary": "This extension requests moderate permissions...",
  "scanned_at": "2026-03-01T12:00:00Z",
  "scanner_version": "1.0.0"
}
```

## Grading Scale

| Score | Grade | Label | Color |
|-------|-------|-------|-------|
| 90-100 | A+ | Fort Knox | 🟢 Green |
| 80-89 | A | Solid | 🟢 Light Green |
| 70-79 | B | Mostly Harmless | 🟡 Yellow |
| 50-69 | C | Eyebrow Raiser | 🟠 Orange |
| 30-49 | D | Red Flags | 🔴 Red |
| 0-29 | F | Run. | ⚫ Black |

## API

### `scanManifest(manifest, options?)`

Synchronously scan a parsed manifest.json object. Returns a `ScanReport`.

### `scanFromCrx(buffer, options?)`

Extract manifest from a CRX3 file buffer and scan it. Returns `Promise<ScanReport>`.

### `scan(extensionId, options?)`

Download an extension from the Chrome Web Store by ID and scan it. Returns `Promise<ScanReport>`.

### Options

```typescript
interface ScanOptions {
  extensionId?: string; // Override extension ID in the report
}
```

## License

MIT — [Zovo](https://zovo.dev)
