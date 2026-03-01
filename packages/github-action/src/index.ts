import * as core from '@actions/core';
import * as github from '@actions/github';
import { scanManifestFile } from './scanner-wrapper';
import { formatComment, findExistingComment } from './comment';

async function run(): Promise<void> {
  try {
    // ── 1. Read inputs ──
    const manifestPath = core.getInput('manifest-path');
    const githubToken = core.getInput('github-token', { required: true });
    const failBelow = parseInt(core.getInput('fail-below'), 10) || 0;
    const shouldComment = core.getInput('comment') !== 'false';

    core.info(`Scanning manifest at: ${manifestPath}`);

    // ── 2. Run the scanner ──
    const report = scanManifestFile(manifestPath);

    core.info(`Score: ${report.score}/100 | Grade: ${report.grade} — ${report.label}`);
    core.info(`Risks found: ${report.risks.length}`);

    // ── 3. Set outputs ──
    core.setOutput('score', report.score.toString());
    core.setOutput('grade', report.grade);
    core.setOutput('report', JSON.stringify(report));

    // ── 4. Post/update PR comment ──
    if (shouldComment && github.context.payload.pull_request) {
      const octokit = github.getOctokit(githubToken);
      const { owner, repo } = github.context.repo;
      const prNumber = github.context.payload.pull_request.number;

      const commentBody = formatComment(report);

      const existingCommentId = await findExistingComment(
        octokit,
        owner,
        repo,
        prNumber
      );

      if (existingCommentId) {
        core.info(`Updating existing comment (ID: ${existingCommentId})`);
        await octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: existingCommentId,
          body: commentBody,
        });
      } else {
        core.info('Posting new PR comment');
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: commentBody,
        });
      }
    } else if (shouldComment) {
      core.info('Not a pull_request event — skipping PR comment');
    }

    // ── 5. Write job summary ──
    const gradeEmoji =
      report.grade === 'A+' || report.grade === 'A'
        ? '\u2705'
        : report.grade === 'B'
          ? '\uD83D\uDFE1'
          : report.grade === 'C'
            ? '\uD83D\uDFE0'
            : '\uD83D\uDD34';

    await core.summary
      .addHeading('\uD83D\uDEE1\uFE0F Zovo Permissions Scanner')
      .addTable([
        [
          { data: 'Score', header: true },
          { data: 'Grade', header: true },
          { data: 'Risks', header: true },
          { data: 'Bonuses', header: true },
        ],
        [
          `${report.score}/100`,
          `${gradeEmoji} ${report.grade} — ${report.label}`,
          `${report.risks.length}`,
          `${report.bonuses.length}`,
        ],
      ])
      .addRaw(report.summary)
      .write();

    // ── 6. Fail if below threshold ──
    if (failBelow > 0 && report.score < failBelow) {
      core.setFailed(
        `Score ${report.score}/100 is below the required threshold of ${failBelow}. ` +
          `Grade: ${report.grade} — ${report.label}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
