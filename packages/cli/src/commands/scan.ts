import chalk from 'chalk';
import ora from 'ora';
import { scan, scanFromCrx, scanManifest, ScanReport } from '@zovo/permissions-scanner';
import { detectInputType, readManifestFile, readCrxFile } from '../utils';
import { formatTerminal } from '../formatters/terminal';
import { formatJson } from '../formatters/json';
import { compareExtensions } from './compare';

export async function scanCommand(
  target: string,
  options: { json?: boolean; compare?: string }
): Promise<void> {
  if (options.compare) {
    await compareExtensions(target, options.compare, !!options.json);
    return;
  }

  try {
    let report: ScanReport;
    const inputType = detectInputType(target);

    if (inputType === 'manifest') {
      const manifest = readManifestFile(target);
      report = scanManifest(manifest);
    } else if (inputType === 'crx') {
      const spinner = ora('Reading and scanning CRX file...').start();
      try {
        const buffer = readCrxFile(target);
        report = await scanFromCrx(buffer);
        spinner.succeed('CRX file scanned successfully');
      } catch (err) {
        spinner.fail('Failed to scan CRX file');
        throw err;
      }
    } else {
      const spinner = ora(`Downloading and scanning extension ${target}...`).start();
      try {
        report = await scan(target);
        spinner.succeed('Extension scanned successfully');
      } catch (err) {
        spinner.fail('Failed to scan extension');
        throw err;
      }
    }

    if (options.json) {
      console.log(formatJson(report));
    } else {
      console.log(formatTerminal(report));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}
