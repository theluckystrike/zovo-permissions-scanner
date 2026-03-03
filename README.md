# Zovo Permissions Scanner

[![npm version](https://img.shields.io/npm/v/@zovo/permissions-scanner)](https://npmjs.com/package/@zovo/permissions-scanner)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![CI Status](https://github.com/theluckystrike/zovo-permissions-scanner/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/zovo-permissions-scanner/actions)
[![Discord](https://img.shields.io/badge/Discord-Zovo-blueviolet.svg?logo=discord)](https://discord.gg/zovo)
[![GitHub Stars](https://img.shields.io/github/stars/theluckystrike/zovo-permissions-scanner?style=social)](https://github.com/theluckystrike/zovo-permissions-scanner)

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

## Installation

### From npm (Core Library)

```bash
# Install core library
npm install @zovo/permissions-scanner

# Install CLI tool
npm install -g @zovo/scan
```

### From Source

```bash
# Clone the repository
git clone https://github.com/theluckystrike/zovo-permissions-scanner.git
cd zovo-permissions-scanner

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Using the CLI

```bash
# Scan a Chrome extension by ID
@zovo/scan --extension-id ExtensionIdHere

# Scan from a local CRX file
@zovo/scan --crx path/to/extension.crx

# Scan from a directory
@zovo/scan --directory path/to/extension/
```

### Using the TypeScript Library

```typescript
import { scanExtension } from '@zovo/permissions-scanner';

const result = await scanExtension({
  source: 'path/to/extension',
  includeManifest: true,
});

console.log(result.grade); // e.g., "A+", "B", "C", "D", "F"
console.log(result.risks); // Array of identified risks
console.log(result.permissions); // Detailed permission analysis
```

### Using the GitHub Action

```yaml
- uses: theLuckystrike/zovo-permissions-scanner@v1
  with:
    extension-id: ${{ vars.EXTENSION_ID }}
```

## API

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | POST | Scan an extension |
| `/api/grade/:id` | GET | Get grade for an extension |

Visit [scan.zovo.one](https://scan.zovo.one) to use the web interface.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/scanner-improvement`
3. **Make** your changes
4. **Run** tests: `npm test`
5. **Lint** your code: `npm run lint`
6. **Commit** your changes: `git commit -m 'Add new scanner feature'`
7. **Push** to the branch: `git push origin feature/scanner-improvement`
8. **Submit** a Pull Request

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run dev` | Development mode |

## See Also

### Related Zovo Repositories

- [zovo-extension-template](https://github.com/theluckystrike/zovo-extension-template) - Boilerplate for building privacy-first Chrome extensions
- [zovo-types-webext](https://github.com/theluckystrike/zovo-types-webext) - Comprehensive TypeScript type definitions for browser extensions
- [zovo-chrome-extensions](https://github.com/theluckystrike/zovo-chrome-extensions) - Collection of Zovo Chrome extensions
- [zovo-content](https://github.com/theluckystrike/zovo-content) - Marketing content for Zovo extensions
- [zovo-indexer](https://github.com/theluckystrike/zovo-indexer) - Indexing service for Zovo extensions
- [zovo-tab-suspender-public](https://github.com/theluckystrike/zovo-tab-suspender-public) - Memory-saving tab suspenders

### Zovo Chrome Extensions

- [Zovo Permissions Scanner](https://chrome.google.com/webstore/detail/zovo-permissions-scanner) - Install the browser extension
- [Zovo Tab Manager](https://chrome.google.com/webstore) - Manage tabs efficiently
- [Zovo Focus](https://chrome.google.com/webstore) - Block distractions

Visit [zovo.one](https://zovo.one) for more information about Zovo products.

## License

MIT
