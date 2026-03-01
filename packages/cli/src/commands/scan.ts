import chalk from 'chalk';
import ora from 'ora';
import { scan, scanFromCrx, scanManifest, ScanReport } from '@zovo/permissions-scanner';
import { detectInputType, readManifestFile, readCrxFile } from '../utils';
import { compareExtensions } from './compare';

/**
 * Perform a scan based on the input (extension ID, manifest path, or CRX path).
 * Returns the ScanReport on success.
 */
async function performScan(input: string): Promise<ScanReport> {
  const inputType = detectInputType(input);

  switch (inputType) {
    case 'manifest': {
      const manifest = readManifestFile(input);
      return scanManifest(manifest);
    }

    case 'crx': {
      const buffer = readCrxFile(input);
      const spinner = ora('Extracting manifest from CRX file...').start();
      try {
        const report = await scanFromCrx(buffer);
        spinner.succeed('CRX file scanned successfully');
        return report;
      } catch (err) {
        spinner.fail('Failed to scan CRX file');
        throw err;
      }
    }

    case 'extension_id': {
      const spinner = ora(`Downloading extension ${chalk.cyan(input)} from Chrome Web Store...`).start();
      try {
        const report = await scan(input);
        spinner.succeed(`Extension ${chalk.cyan(input)} scanned successfully`);
        return report;
      } catch (err) {
        spinner.fail(`Failed to scan extension ${chalk.cyan(input)}`);
        throw err;
      }
    }
  }
}

/**
 * Main scan command handler.
 * Called by commander when the default command runs.
 */
export async function scanCommand(input: string, options: { json?: boolean; compare?: string }): Promise<void> {
  try {
    // If --compare is provided, delegate to the compare handler
    if (options.compare) {
      await compareExtensions(input, options.compare, !!options.json);
      return;
    }

    const report = await performScan(input);

    if (options.json) {
      // JSON output mode — import the JSON formatter
      const { formatJson } = await import('../formatters/json');
      process.stdout.write(formatJson(report) + '\n');
    } else {
      // Terminal output mode — import the terminal formatter
      const { formatTerminal } = await import('../formatters/terminal');
      process.stdout.write(formatTerminal(report) + '\n');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red('\n  Error: ') + message);
    process.exit(1);
  }
}
