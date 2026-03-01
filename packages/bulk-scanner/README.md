# @zovo/bulk-scanner

Bulk scan Chrome extensions using the Zovo Permissions Scanner engine. Generates datasets for the **Wall of Shame** marketing launch and the [scan.zovo.dev](https://scan.zovo.dev) leaderboard.

## What It Does

1. Takes a list of Chrome extension IDs (from a bundled list, a file, or CLI args)
2. Downloads and scans each extension using the core scanner engine
3. Rate-limits requests to avoid hammering Chrome Web Store servers
4. Outputs results as JSON and CSV
5. Generates summary statistics with grade distribution and "worst offenders"

## Installation

```bash
npm install
```

## Usage

```bash
# Scan all extensions from the bundled top-extensions.json (60 extensions)
npx ts-node src/index.ts

# Scan specific extension IDs
npx ts-node src/index.ts --ids cjpalhdlnbpafiamejdnhcphjbkeiagm,gighmmpiobklfepjocnamgkkbiglidom

# Scan IDs from a text file (one ID per line)
npx ts-node src/index.ts --file my-ids.txt

# Limit to the first 50 extensions
npx ts-node src/index.ts --limit 50

# Custom output directory
npx ts-node src/index.ts --output ./results

# Custom delay between scans (default: 2500ms)
npx ts-node src/index.ts --delay 3000

# Combine options
npx ts-node src/index.ts --limit 20 --delay 2000 --output ./my-results
```

### npm Scripts

```bash
npm run scan          # Full scan of all bundled extensions
npm run scan:top50    # Scan the first 50 extensions
npm run build         # Compile TypeScript
npm run lint          # Type-check without emitting
```

## Output Files

All output goes to the `./output/` directory (configurable with `--output`).

| File | Description |
|---|---|
| `scan-results.json` | Full scan reports for every extension |
| `summary.json` | Aggregate statistics, grade distribution, errors, duration |
| `wall-of-shame.json` | Extensions with score < 30 (grade F), sorted worst-first |
| `leaderboard.json` | All extensions ranked by score (highest first) |
| `scan-results.csv` | Flat CSV with key fields for spreadsheet analysis |

### CSV Columns

`extension_id`, `name`, `version`, `score`, `grade`, `label`, `risks_count`, `critical_risks`, `high_risks`, `scanned_at`

## Customizing the Extension List

### Bundled List

Edit `data/top-extensions.json` to add or remove extensions:

```json
[
  { "id": "cjpalhdlnbpafiamejdnhcphjbkeiagm", "name": "uBlock Origin" },
  { "id": "gighmmpiobklfepjocnamgkkbiglidom", "name": "AdBlock" }
]
```

The `id` field is the 32-character string from the Chrome Web Store URL:
`https://chromewebstore.google.com/detail/extension-name/<ID>`

### Text File

Create a plain text file with one extension ID per line:

```
cjpalhdlnbpafiamejdnhcphjbkeiagm
gighmmpiobklfepjocnamgkkbiglidom
cfhdojbkjhnklbpkdaibdccddilifddb
```

Lines starting with `#` are treated as comments and ignored.

## Rate Limiting

The scanner defaults to a **2.5 second delay** between each download to be respectful to Chrome Web Store servers. You can adjust this with `--delay`:

- `--delay 1000` — 1 second between scans (faster, but higher risk of throttling)
- `--delay 5000` — 5 seconds between scans (very conservative)

Scans run sequentially (concurrency of 1) to avoid triggering rate limits or IP blocks from Google. A full scan of 60 extensions takes roughly 2.5 to 3 minutes with the default delay.

## Architecture

```
src/
  index.ts          CLI entry point (commander-based)
  runner.ts         Bulk scan orchestration with progress callbacks
  id-sources.ts     Load extension IDs from JSON, files, or CLI args
  stats.ts          Compute summary statistics from scan reports
  exporters/
    json-exporter.ts   Write JSON output files
    csv-exporter.ts    Write CSV output file
```

## License

MIT
