# Zovo Permissions Scanner

Read a Chrome extension's manifest permissions and produce a score, grade and risk report. The score is a permission-based heuristic. It does not prove that an extension is safe or inspect all of its behavior.

## Source packages

| Package identifier | Source |
| --- | --- |
| `@zovo/permissions-scanner` | [Core scanner](./packages/core/) |
| `@zovo/scan` | [CLI](./packages/cli/) |
| `@zovo/scan-api` | [Hono API](./packages/api/) |
| `@zovo/scan-action` | [GitHub Action](./packages/github-action/) |
| `@zovo/cws-overlay` | [Chrome Web Store overlay](./packages/cws-overlay/) |
| `@zovo/bulk-scanner` | [Bulk scanner](./packages/bulk-scanner/) |

These are package identifiers in this repository. They do not establish public npm availability. On 27 October 2026, the public npm registry returned 404 for both `@zovo/permissions-scanner` and `@zovo/scan`. Use the source workflow below.

## Build the core and CLI from source

Use Node.js 20 or later and npm. Run these commands in order. The CLI uses the local core package, so build the core first.

```bash
git clone https://github.com/zovo-one/zovo-permissions-scanner.git
cd zovo-permissions-scanner

npm ci --prefix packages/core
npm run build --prefix packages/core

npm ci --prefix packages/cli
npm run build --prefix packages/cli

node packages/cli/dist/index.js --help
```

This repository has no root `package.json`. Install and build each package in its own directory, or use `--prefix` as shown above. No npm publication or global package installation is needed for this workflow.

## Scan a local manifest

From the repository root, pass the path to a `manifest.json` file.

```bash
node packages/cli/dist/index.js /path/to/extension/manifest.json --json
```

The local manifest scan does not download the extension from the Chrome Web Store. It reports the requested permissions, risk reasons, a numeric score and a letter grade.

Other supported targets are a local CRX file or a Chrome Web Store extension ID. Scanning an extension ID requires network access.

```bash
node packages/cli/dist/index.js /path/to/extension.crx
node packages/cli/dist/index.js nkbihfbeogaeaoehlefnkodbefgpgknn
```

Pass targets as positional arguments. The CLI does not accept `--extension-id`, `--crx` or `--directory` flags. To scan an unpacked extension, provide its manifest file rather than its directory.

## Compare two targets

```bash
node packages/cli/dist/index.js compare first-manifest.json second-manifest.json --json
```

The equivalent single-target option is `first-manifest.json --compare second-manifest.json`. See the [CLI guide](./packages/cli/README.md) for supported arguments.

## Use the built core library

After building the core, run this JavaScript from the repository root.

```javascript
const { scanManifest } = require('./packages/core/dist');

const report = scanManifest({
  manifest_version: 3,
  name: 'Local example',
  version: '1.0.0',
  permissions: ['storage'],
});

console.log(report.grade);
console.log(report.risks);
```

The public scanner exports are `scanManifest`, `scanFromCrx` and `scan`. The exports do not include `scanExtension`. See the [core API guide](./packages/core/README.md) for their inputs and output fields.

## Validate a change

```bash
npm test --prefix packages/core
npm run lint --prefix packages/core
npm run build --prefix packages/cli
```

The core has tests and a TypeScript check. The CLI's build also checks its TypeScript. These commands do not validate every other source package.

## Other components

The API, browser overlay, bulk scanner and GitHub Action have separate package guides. They are not part of the verified core and CLI workflow above. This repository has no root `action.yml` or `v1` tag, so a root-level `uses: zovo-one/zovo-permissions-scanner@v1` action reference is not available.

## Links

- [Scanner website](https://scan.zovo.one)
- [Zovo](https://zovo.one)
- [Contribution workflow](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project)

## License

MIT. See [LICENSE](./LICENSE).
