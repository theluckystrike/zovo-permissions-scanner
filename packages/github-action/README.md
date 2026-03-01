# Zovo Permissions Scanner — GitHub Action

Scan Chrome extension permissions on every PR. Get grades, diffs, and recommendations.

## Quick Start

```yaml
# .github/workflows/permissions.yml
name: Permission Check
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Needed for base branch comparison
      - uses: theluckystrike/zovo-permissions-scanner@v1
        with:
          fail-below: 50
```

**Important:** `fetch-depth: 0` is required so the action can access the base branch manifest for before/after comparison.

## What It Does

On every PR:

1. Finds `manifest.json` (auto-detects or uses custom path)
2. Scans the PR's manifest for permission risks
3. Compares with the base branch manifest (before → after)
4. Posts a PR comment showing score changes and new risks
5. Optionally fails the check if score drops below a threshold

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `manifest-path` | Path to manifest.json (auto-detects if empty) | Auto-detect |
| `fail-below` | Fail check if score below threshold (0 = disabled) | `0` |
| `comment` | Post PR comment with results | `true` |
| `github-token` | Token for PR comments | `${{ github.token }}` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `score` | Current permission score (0-100) | `72` |
| `grade` | Letter grade | `B` |
| `score-delta` | Score change from base branch | `-14` |

## Auto-Detection

If `manifest-path` is not set, the action searches:

1. `./manifest.json`
2. `./src/manifest.json`
3. `./extension/manifest.json`
4. `./public/manifest.json`
5. `./chrome/manifest.json`

## PR Comment

The action posts (or updates) a comment showing:

- Score before → after with delta
- Grade change with label
- Permission changes table (added/removed/unchanged)
- New risks with recommendations
- Positive signals (bonuses)

## Examples

### Basic — just scan and comment

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
```

### Fail below threshold

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    fail-below: 50
```

### Custom manifest path

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    manifest-path: 'src/manifest.json'
```

### Use outputs in subsequent steps

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  id: scan
- run: echo "Score is ${{ steps.scan.outputs.score }}, grade is ${{ steps.scan.outputs.grade }}"
```

### Disable comments (just check)

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    comment: 'false'
    fail-below: 50
```

## README Badge

Add a Zovo score badge to your extension's README:

```markdown
[![Zovo Score](https://api.scan.zovo.dev/api/badge/YOUR_EXTENSION_ID)](https://scan.zovo.dev/report/YOUR_EXTENSION_ID)
```

## Grading Scale

| Score | Grade | Label |
|-------|-------|-------|
| 90-100 | A+ | Fort Knox |
| 80-89 | A | Solid |
| 70-79 | B | Mostly Harmless |
| 50-69 | C | Eyebrow Raiser |
| 30-49 | D | Red Flags |
| 0-29 | F | Run. |

## Links

- Website: https://scan.zovo.dev
- Core Engine: https://github.com/theluckystrike/zovo-permissions-scanner
- Zovo: https://zovo.dev

## License

MIT
