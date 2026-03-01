#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { compareExtensions } from './commands/compare';

const program = new Command();

program
  .name('zovo-scan')
  .version('1.0.0')
  .description('Scan Chrome extension permissions and assess security risks');

// Default command: scan
program
  .argument('<target>', 'Extension ID, path to manifest.json, or path to .crx file')
  .option('--json', 'Output raw JSON (for piping)')
  .option('--compare <target>', 'Compare with another extension')
  .action(async (target: string, options: { json?: boolean; compare?: string }) => {
    await scanCommand(target, options);
  });

// Explicit compare subcommand
program
  .command('compare <target1> <target2>')
  .description('Compare two extensions side-by-side')
  .option('--json', 'Output raw JSON (for piping)')
  .action(async (target1: string, target2: string, options: { json?: boolean }) => {
    await compareExtensions(target1, target2, !!options.json);
  });

program.parse(process.argv);
