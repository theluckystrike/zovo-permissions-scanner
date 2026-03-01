# @zovo/bulk-scanner

Bulk scan the top Chrome extensions and generate privacy reports, including the "Wall of Shame" and "Wall of Fame".

## Usage

```bash
# Scan top 50 extensions
npx ts-node src/index.ts scan --limit 50

# Scan all with 3s delay between scans
npx ts-node src/index.ts scan --delay 3000

# Resume a crashed scan
npx ts-node src/index.ts scan --resume

# Skip Supabase persistence
npx ts-node src/index.ts scan --skip-supabase

# Regenerate reports from previous scan data
npx ts-node src/index.ts report
```

## Output Files

All reports are generated in `data/results/`:

| File | Description |
|------|-------------|
| `full-results.json` | Complete scan results for all extensions |
| `wall-of-shame.md` | Top 50 worst privacy scores |
| `wall-of-fame.md` | Top 20 best privacy scores |
| `statistics.md` | Key findings and score distribution |
| `twitter-thread.md` | Ready-to-post Twitter/X thread |
| `hn-submission.md` | Hacker News submission draft |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | No* | Supabase project URL |
| `SUPABASE_KEY` | No* | Supabase anon/service key |

\* Required unless `--skip-supabase` is used.

## Seed Data

Extension IDs are loaded from `data/seed-extensions.json`. Add or modify entries to change which extensions are scanned.

## License

MIT
