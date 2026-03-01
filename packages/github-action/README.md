# Zovo Permissions Scanner — GitHub Action

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github)](https://github.com/theluckystrike/zovo-permissions-scanner)

Automatically scan your Chrome extension's permissions on every pull request. Posts a privacy/security grade as a PR comment with a full risk breakdown.

## Quick Start

Add this workflow to `.github/workflows/extension-scan.yml`:

```yaml
name: Extension Security Scan
on:
  pull_request:
    paths: ['manifest.json', 'src/manifest.json']

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: theluckystrike/zovo-permissions-scanner@v1
        with:
          manifest-path: 'manifest.json'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `manifest-path` | Path to the extension's `manifest.json` | No | `manifest.json` |
| `github-token` | GitHub token for posting PR comments | Yes | `${{ github.token }}` |
| `fail-below` | Fail the check if the score is below this threshold (0-100). Set to `0` to never fail. | No | `0` |
| `comment` | Whether to post a PR comment with results | No | `true` |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | The privacy/security score (0-100) |
| `grade` | The letter grade (`A+`, `A`, `B`, `C`, `D`, `F`) |
| `report` | Full JSON report from the scanner |

## Examples

### Basic Usage

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    manifest-path: 'manifest.json'
```

### Fail Below a Score Threshold

Block merges if the extension scores below 50:

```yaml
name: Extension Security Scan
on:
  pull_request:
    paths: ['manifest.json', 'src/manifest.json']

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: theluckystrike/zovo-permissions-scanner@v1
        with:
          manifest-path: 'manifest.json'
          fail-below: 50
```

### Use the Score in Subsequent Steps

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  id: scan
  with:
    manifest-path: 'manifest.json'

- run: echo "Score is ${{ steps.scan.outputs.score }}, grade is ${{ steps.scan.outputs.grade }}"
```

### Custom Manifest Path

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    manifest-path: 'extension/src/manifest.json'
```

### Disable PR Comment

Run the scan and get outputs, but don't post a comment:

```yaml
- uses: theluckystrike/zovo-permissions-scanner@v1
  with:
    manifest-path: 'manifest.json'
    comment: 'false'
```

## What the PR Comment Looks Like

The action posts (or updates) a comment on your PR with:

- **Score** — 0 to 100
- **Grade** — A+ (Fort Knox) through F (Run.)
- **Risk table** — every risky permission with severity and explanation
- **Good practices** — bonuses for things like using `optional_permissions`

## How It Works

1. Reads `manifest.json` from your repository
2. Runs the [Zovo Permissions Scanner](https://scan.zovo.dev) engine
3. Posts results as a PR comment (updates existing comment on re-runs)
4. Optionally fails the workflow if the score is too low

## License

MIT
