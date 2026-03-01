#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { compareExtensions } from './commands/compare';

const program = new Command();

program
  .name('zovo-scan')
  .version('1.0.0')
  .description('Scan Chrome extension permissions and assess risk');

program
  .argument('<target>', 'Extension ID, .crx file path, or manifest .json file path')
  .option('--json', 'Output results as JSON')
  .option('--compare <target>', 'Compare with another extension')
  .action(async (target: string, options: { json?: boolean; compare?: string }) => {
    await scanCommand(target, options);
  });

program
  .command('compare <target1> <target2>')
  .description('Compare permissions of two extensions side-by-side')
  .option('--json', 'Output results as JSON')
  .action(async (target1: string, target2: string, options: { json?: boolean }) => {
    await compareExtensions(target1, target2, !!options.json);
  });

program.parseAsync(process.argv).catch(() => {
  process.exit(1);
});
