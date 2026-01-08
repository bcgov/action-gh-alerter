/**
 * Issue Manager Module
 * Handles creating and updating GitHub issues with scan results
 */

const ISSUE_TITLE = '🔐 Password Leak Scan Report';
const ISSUE_LABEL = 'password-leak-scan';

/**
 * Creates or updates a GitHub issue with scan results
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} results - Scan results
 * @param {string[]} labels - Labels to apply to the issue
 */
async function manageIssue(octokit, owner, repo, results, labels) {
  try {
    // Search for existing issue
    const existingIssue = await findExistingIssue(octokit, owner, repo, labels);
    
    // Format the issue body
    const body = formatIssueBody(results);
    
    if (existingIssue) {
      // Update existing issue
      console.log(`   Updating existing issue #${existingIssue.number}`);
      await octokit.issues.update({
        owner,
        repo,
        issue_number: existingIssue.number,
        body,
        state: results.totalAlerts > 0 ? 'open' : 'closed'
      });
      console.log(`   ✅ Issue #${existingIssue.number} updated successfully`);
      console.log(`   🔗 ${existingIssue.html_url}`);
    } else {
      // Create new issue
      console.log('   Creating new issue...');
      const issue = await octokit.issues.create({
        owner,
        repo,
        title: ISSUE_TITLE,
        body,
        labels
      });
      console.log(`   ✅ Issue #${issue.data.number} created successfully`);
      console.log(`   🔗 ${issue.data.html_url}`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to manage issue: ${error.message}`);
    // Don't throw - issue management failure shouldn't fail the scan
  }
}

/**
 * Finds an existing password leak scan issue
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string[]} labels - Labels to search for
 * @returns {Object|null} Existing issue or null
 */
async function findExistingIssue(octokit, owner, repo, labels) {
  try {
    // Use the first label that matches the pattern, or the hardcoded ISSUE_LABEL as fallback
    const searchLabel = labels.find(l => l.includes('password-leak')) || ISSUE_LABEL;
    
    const response = await octokit.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:issue label:${searchLabel} in:title "${ISSUE_TITLE}"`
    });
    
    if (response.data.items.length > 0) {
      return response.data.items[0];
    }
    return null;
  } catch (error) {
    console.error(`   ⚠️  Error searching for existing issue: ${error.message}`);
    return null;
  }
}

/**
 * Formats scan results into a markdown issue body
 * @param {Object} results - Scan results
 * @returns {string} Formatted markdown
 */
function formatIssueBody(results) {
  const timestamp = new Date(results.scannedAt).toUTCString();
  
  let body = `# Password Leak Scan Report\n\n`;
  body += `**Last Scan:** ${timestamp}\n\n`;
  body += `## Summary\n\n`;
  body += `- **Total Repositories Scanned:** ${results.totalRepos}\n`;
  body += `- **Repositories with Password Leaks:** ${results.reposWithAlerts}\n`;
  body += `- **Total Password Leak Alerts:** ${results.totalAlerts}\n`;
  body += `- **Failed Scans:** ${results.failedRepos}\n\n`;

  if (results.totalAlerts === 0) {
    body += `## ✅ No Password Leaks Detected\n\n`;
    body += `All scanned repositories are clear of password leaks.\n\n`;
  } else {
    body += `## ⚠️ Password Leaks Detected\n\n`;
    body += `The following repositories have open password leak alerts:\n\n`;

    for (const repoResult of results.alerts) {
      body += `### ${repoResult.org}/${repoResult.repo}\n\n`;
      body += `Repository: [${repoResult.org}/${repoResult.repo}](${repoResult.url})\n\n`;
      body += `**Alerts:** ${repoResult.alerts.length}\n\n`;
      
      body += `| Alert # | Secret Type | State | Created At | URL |\n`;
      body += `|---------|-------------|-------|------------|-----|\n`;
      
      for (const alert of repoResult.alerts) {
        const createdAt = new Date(alert.created_at).toLocaleDateString();
        const alertUrl = alert.html_url || `https://github.com/${repoResult.org}/${repoResult.repo}/security/secret-scanning`;
        const secretType = alert.secret_type_display_name || alert.secret_type || 'password';
        
        body += `| #${alert.number} | ${secretType} | ${alert.state} | ${createdAt} | [View](${alertUrl}) |\n`;
      }
      
      body += `\n`;
    }
  }

  if (results.errors.length > 0) {
    body += `## ⚠️ Errors Encountered\n\n`;
    body += `The following errors occurred during scanning:\n\n`;
    for (const error of results.errors) {
      body += `- ${error}\n`;
    }
    body += `\n`;
  }

  body += `---\n\n`;
  body += `*This issue is automatically generated and updated by the Password Leak Scanner workflow.*\n`;
  body += `*Subscribe to this issue to receive email notifications when password leaks are detected.*\n`;

  return body;
}

module.exports = {
  manageIssue
};
