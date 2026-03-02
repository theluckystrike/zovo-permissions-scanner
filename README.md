# Zovo Permissions Scanner

**Know what your extensions can see.**

Open-source Chrome extension permissions scanner that analyzes any browser extension and generates a privacy/security report with a letter grade (A+ to F).

## Packages

| Package | Description |
|---------|-------------|
| [`@zovo/permissions-scanner`](./packages/core/) | Core scanner engine — TypeScript library |
| [`@zovo/scan`](./packages/cli/) | CLI tool — scan from your terminal |
| [`@zovo/scan-api`](./packages/api/) | REST API — Hono on Cloudflare Workers |
| [`@zovo/scan-action`](./packages/github-action/) | GitHub Action — scan PRs automatically |
| [`@zovo/cws-overlay`](./packages/cws-overlay/) | Chrome extension — grades on the Web Store |
| [`@zovo/bulk-scanner`](./packages/bulk-scanner/) | Bulk scanner — scan top 500 extensions |

## Links

- **Website:** [scan.zovo.one](https://scan.zovo.one)
- **Zovo:** [zovo.one](https://zovo.one)

## License

MIT
