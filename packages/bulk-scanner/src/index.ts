#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadExtensionList } from './scraper';
import { massScanner } from './mass-scanner';
import { generateAllReports } from './report-generator';
import { generateSocialContent } from './social-generator';
import { writeToSupabase } from './supabase-writer';
import { loadProgress } from './utils/progress';
import type { ScanReport } from '@zovo/permissions-scanner';

interface ScanResult {
  report: ScanReport;
  extensionMeta: { id: string; name: string; category: string };
}

const program = new Command();

program
  .name('zovo-bulk-scan')
  .description('Bulk scan top Chrome extensions and generate reports')
  .version('1.0.0');

program
  .command('scan')
  .description('Run the bulk scanner')
  .option('-l, --limit <number>', 'Maximum extensions to scan', '500')
  .option('-r, --resume', 'Resume from last progress checkpoint', false)
  .option('-d, --delay <ms>', 'Delay between scans in ms', '2000')
  .option('--skip-supabase', 'Skip writing to Supabase', false)
  .option('--output <dir>', 'Output directory for reports', 'data/results')
  .action(async (opts) => {
    const limit = parseInt(opts.limit, 10);
    const delay = parseInt(opts.delay, 10);
    const resume = opts.resume as boolean;
    const skipSupabase = opts.skipSupabase as boolean;
    const outputDir = opts.output as string;

    console.log(chalk.bold.cyan('\n🔍 Zovo Bulk Scanner\n'));
    console.log(chalk.gray(`  Limit: ${limit} extensions`));
    console.log(chalk.gray(`  Delay: ${delay}ms between scans`));
    console.log(chalk.gray(`  Resume: ${resume ? 'yes' : 'no'}`));
    console.log(chalk.gray(`  Supabase: ${skipSupabase ? 'disabled' : 'enabled'}\n`));

    // Step 1: Load extension list
    const listSpinner = ora('Loading extension list...').start();
    let extensions: Array<{ id: string; name: string; category: string }>;
    try {
      extensions = await loadExtensionList(limit);
      listSpinner.succeed(`Loaded ${extensions.length} extensions`);
    } catch (err) {
      listSpinner.fail('Failed to load extension list');
      console.error(err);
      process.exit(1);
    }

    // Step 2: Mass scan
    console.log(chalk.bold('\n📡 Starting mass scan...\n'));
    const { results, failures } = await massScanner(extensions, {
      delayMs: delay,
      resume,
    });

    console.log(chalk.bold(`\n✅ Scan complete: ${results.length} succeeded, ${failures.length} failed\n`));

    // Step 3: Write to Supabase
    if (!skipSupabase && results.length > 0) {
      const sbSpinner = ora('Writing results to Supabase...').start();
      try {
        await writeToSupabase(results.map(r => r.report));
        sbSpinner.succeed('Results written to Supabase');
      } catch (err) {
        sbSpinner.fail('Supabase write failed (non-fatal)');
        console.error(chalk.yellow('  ' + (err instanceof Error ? err.message : String(err))));
      }
    }

    // Step 4: Generate reports
    const reportSpinner = ora('Generating reports...').start();
    try {
      await generateAllReports(results, failures, outputDir);
      reportSpinner.succeed('Reports generated');
    } catch (err) {
      reportSpinner.fail('Report generation failed');
      console.error(err);
      process.exit(1);
    }

    // Step 5: Generate social content
    const socialSpinner = ora('Generating social media content...').start();
    try {
      await generateSocialContent(results, outputDir);
      socialSpinner.succeed('Social content generated');
    } catch (err) {
      socialSpinner.fail('Social content generation failed (non-fatal)');
      console.error(chalk.yellow('  ' + (err instanceof Error ? err.message : String(err))));
    }

    console.log(chalk.bold.green('\n🎉 All done! Reports saved to: ' + outputDir + '\n'));
  });

program
  .command('report')
  .description('Regenerate reports from existing progress data')
  .option('--output <dir>', 'Output directory for reports', 'data/results')
  .action(async (opts) => {
    const outputDir = opts.output as string;
    const progress = loadProgress();

    if (progress.results.length === 0) {
      console.log(chalk.yellow('No scan results found. Run "scan" first.'));
      process.exit(1);
    }

    console.log(chalk.bold.cyan(`\n📊 Regenerating reports from ${progress.results.length} results...\n`));

    await generateAllReports(
      progress.results.map(r => ({
        report: r.report,
        extensionMeta: { id: r.report.extension_id, name: r.report.name, category: '' },
      })),
      progress.failures,
      outputDir,
    );
    await generateSocialContent(
      progress.results.map(r => ({
        report: r.report,
        extensionMeta: { id: r.report.extension_id, name: r.report.name, category: '' },
      })),
      outputDir,
    );

    console.log(chalk.bold.green('\n🎉 Reports regenerated in: ' + outputDir + '\n'));
  });

program.parse();
