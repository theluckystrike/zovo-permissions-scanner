# @zovo/scan

CLI for the Zovo Permissions Scanner. Analyze Chrome extension permissions, identify risks, and get a security grade — all from your terminal.

## Installation

```bash
npm install -g @zovo/scan
```

## Usage

### Scan by extension ID

Pass a Chrome Web Store extension ID to fetch and scan its manifest:

```bash
zovo-scan <extension-id>
```

```bash
zovo-scan nkbihfbeogaeaoehlefnkodbefgpgknn
```

### Scan a local manifest.json

Point the scanner at a local `manifest.json` file:

```bash
zovo-scan manifest.json
```

### Scan a .crx file

Provide a path to a packaged `.crx` extension:

```bash
zovo-scan extension.crx
```

### JSON output

Add `--json` to get machine-readable JSON instead of the pretty terminal output:

```bash
zovo-scan <extension-id> --json
```

### Compare multiple extensions

Use `--compare` to scan several extensions side by side:

```bash
zovo-scan --compare <id-1> <id-2> <id-3>
```

Combine with `--json` for structured comparison data:

```bash
zovo-scan --compare <id-1> <id-2> --json
```

## Example Output

```
╔══════════════════════════════════════════════════════════╗
║  Zovo Permissions Scanner                                ║
╚══════════════════════════════════════════════════════════╝

  Extension:  Tab Manager Pro v2.1.0
  Score:      42/100
  Grade:      D — Red Flags 🔴

  ⚠️  RISKS FOUND:

  🔴 CRITICAL: Requests access to ALL websites (<all_urls>)
     → Consider limiting to specific domains your extension needs

  🔴 HIGH: Can intercept and modify network requests (webRequest + webRequestBlocking)
     → Use declarativeNetRequest (MV3) for safer rule-based blocking

  🟡 MEDIUM: Can read all open tab URLs and titles (tabs)
     → Use activeTab if you only need the current tab on click

  ✅ GOOD: Uses optional_permissions for history (+3 points)
  ✅ GOOD: Has privacy policy URL (+3 points)

  Full report: https://scan.zovo.one/report/abc123def456

  ──────────────────────────────────────────────────────
  Scanned by Zovo · https://zovo.one
```

## Web Scanner

For a browser-based experience, visit [scan.zovo.one](https://scan.zovo.one).

## Links

- **Web Scanner**: [scan.zovo.one](https://scan.zovo.one)
- **Zovo**: [zovo.one](https://zovo.one)

## License

MIT
