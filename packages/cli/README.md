# @zovo/scan

CLI source for reading Chrome extension manifest permissions and reporting risk flags and a grade. A permission score is not proof that an extension is safe.

## Build from source

On 27 October 2026, the public npm registry returned 404 for `@zovo/scan` and its core package. The commands below use the local dependency in this repository. They do not require a published npm package or a global installation.

Use Node.js 20 or later. From the repository root, build the core before the CLI.

```bash
npm ci --prefix packages/core
npm run build --prefix packages/core
npm ci --prefix packages/cli
npm run build --prefix packages/cli
node packages/cli/dist/index.js --help
```

To get the repository first, follow the [root source instructions](../../README.md#build-the-core-and-cli-from-source).

## Scan a target

A target is a local `.json` manifest file, a local `.crx` file or a Chrome Web Store extension ID.

```bash
node packages/cli/dist/index.js /path/to/manifest.json
node packages/cli/dist/index.js /path/to/extension.crx
node packages/cli/dist/index.js nkbihfbeogaeaoehlefnkodbefgpgknn
```

Local manifest scans do not download an extension. Extension-ID scans use network access to download the CRX. Pass the manifest file when scanning an unpacked directory.

## JSON output

```bash
node packages/cli/dist/index.js /path/to/manifest.json --json
```

The JSON contains the name, version, score, grade, permissions, risks and scan timestamp. The CLI does not create a hosted report URL or upload this local manifest scan.

## Compare two targets

Use the `compare` subcommand with exactly two targets.

```bash
node packages/cli/dist/index.js compare first-manifest.json second-manifest.json --json
```

Or use the single-target command with one comparison target.

```bash
node packages/cli/dist/index.js first-manifest.json --compare second-manifest.json --json
```

A variadic `--compare <id-1> <id-2> <id-3>` invocation is not supported. The CLI also has no `--extension-id`, `--crx` or `--directory` options.

## Check the build

```bash
npm run build --prefix packages/cli
npm test --prefix packages/core
```

## License

MIT. See the [repository license](../../LICENSE).
