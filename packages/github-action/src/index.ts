import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import { scanManifest, validateManifest, ChromeManifest, ScanReport } from '@zovo/permissions-scanner';
import * as fs from 'fs';

import { findManifestPath } from './manifest-finder';
import { diffReports, ReportDiff } from './diff';
import { formatComment, findExistingComment } from './comment';

async function run(): Promise<void> {
  // ── 1. Get inputs ──
  const manifestPathInput = core.getInput('manifest-path');
  const failBelow = Number(core.getInput('fail-below') || '0');
  const shouldComment = core.getBooleanInput('comment');
  const token = core.getInput('github-token');

  core.info('Zovo Permissions Scanner starting...');

  // ── 2. Find manifest ──
  const manifestPath = findManifestPath(manifestPathInput || undefined);
  core.info(`Found manifest at: ${manifestPath}`);

  // ── 3. Scan current (PR) manifest ──
  const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
  const manifest: ChromeManifest = JSON.parse(rawManifest);
  validateManifest(manifest);
  const afterReport: ScanReport = scanManifest(manifest);
  core.info(`Current scan complete — score: ${afterReport.score}, grade: ${afterReport.grade}`);

  // ── 4. Try to get base branch manifest for comparison ──
  let beforeReport: ScanReport | null = null;
  const isPullRequest = github.context.eventName === 'pull_request';

  if (isPullRequest) {
    const baseRef = github.context.payload.pull_request?.base?.ref;
    if (baseRef) {
      core.info(`Attempting to fetch base manifest from origin/${baseRef}:${manifestPath}`);
      try {
        let baseManifestRaw = '';
        await exec.exec('git', ['show', `origin/${baseRef}:${manifestPath}`], {
          listeners: {
            stdout: (data: Buffer) => {
              baseManifestRaw += data.toString();
            },
          },
          silent: true,
        });

        const baseManifest: ChromeManifest = JSON.parse(baseManifestRaw);
        validateManifest(baseManifest);
        beforeReport = scanManifest(baseManifest);
        core.info(`Base branch scan complete — score: ${beforeReport.score}, grade: ${beforeReport.grade}`);
      } catch (err) {
        core.info(`Could not retrieve base manifest (file may not exist on base branch): ${err}`);
        beforeReport = null;
      }
    }
  }

  // ── 5. Generate diff ──
  const diff: ReportDiff | null = diffReports(beforeReport, afterReport);
  core.info(`Diff generated — score delta: ${diff?.scoreDelta ?? 0}`);

  // ── 6. Set outputs ──
  core.setOutput('score', afterReport.score);
  core.setOutput('grade', afterReport.grade);
  core.setOutput('score-delta', diff?.scoreDelta ?? 0);

  // ── 7. Post PR comment (if enabled and is PR event) ──
  if (shouldComment && isPullRequest && token) {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const prNumber = github.context.payload.pull_request!.number;

    const commentBody = formatComment(afterReport, diff);
    const existingCommentId = await findExistingComment(octokit, owner, repo, prNumber);

    if (existingCommentId) {
      core.info(`Updating existing comment (ID: ${existingCommentId})`);
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingCommentId,
        body: commentBody,
      });
    } else {
      core.info('Creating new PR comment');
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
    }
  }

  // ── 8. Write job summary ──
  await core.summary
    .addHeading('Zovo Permissions Scanner Results')
    .addTable([
      [
        { data: 'Metric', header: true },
        { data: 'Value', header: true },
      ],
      ['Score', String(afterReport.score)],
      ['Grade', `${afterReport.grade} — ${afterReport.label}`],
      ['Risks', String(afterReport.risks.length)],
      ['Score Delta', String(diff?.scoreDelta ?? 'N/A')],
    ])
    .write();

  // ── 9. Check threshold ──
  if (failBelow > 0 && afterReport.score < failBelow) {
    core.setFailed(`Zovo score ${afterReport.score} is below threshold ${failBelow}`);
  }

  core.info('Zovo Permissions Scanner complete.');
}

run().catch(core.setFailed);
