const { Octokit } = require('@octokit/rest');
const { retry } = require('@octokit/plugin-retry');
const { throttling } = require('@octokit/plugin-throttling');
const { scanRepositories } = require('./lib/repo-scanner');
const { manageIssue } = require('./lib/issue-manager');

const MyOctokit = Octokit.plugin(retry, throttling);

async function main() {
  console.log('🔍 Starting Password Leak Scanner');
  console.log('=================================\n');

  // Validate required environment variables
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ ERROR: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const currentRepo = process.env.GITHUB_REPOSITORY;
  if (!currentRepo) {
    console.error('❌ ERROR: GITHUB_REPOSITORY environment variable is required');
    process.exit(1);
  }

  // Parse configuration
  const organizations = (process.env.ORGANIZATIONS || 'bcgov,bcgov-c')
    .split(',')
    .map(org => org.trim())
    .filter(org => org.length > 0);

  const issueLabels = (process.env.ISSUE_LABELS || 'security,password-leak-scan')
    .split(',')
    .map(label => label.trim())
    .filter(label => label.length > 0);

  console.log(`📋 Configuration:`);
  console.log(`   Organizations: ${organizations.join(', ')}`);
  console.log(`   Issue Labels: ${issueLabels.join(', ')}`);
  console.log(`   Target Repository: ${currentRepo}\n`);

  // Initialize Octokit with plugins
  const octokit = new MyOctokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        if (retryCount < 3) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Secondary rate limit hit for request ${options.method} ${options.url}`
        );
        if (retryCount < 3) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
    },
  });

  try {
    // Scan all organizations for password leaks
    console.log('🔎 Scanning repositories for password leaks...\n');
    const results = await scanRepositories(octokit, organizations);

    // Display summary
    console.log('\n📊 Scan Summary:');
    console.log('================');
    console.log(`   Total Repositories Scanned: ${results.totalRepos}`);
    console.log(`   Repositories with Password Leaks: ${results.reposWithAlerts}`);
    console.log(`   Total Password Leak Alerts: ${results.totalAlerts}`);
    console.log(`   Failed Repository Scans: ${results.failedRepos}`);

    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered during scan:`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Create or update issue with findings
    console.log('\n📝 Managing GitHub Issue...');
    const [owner, repo] = currentRepo.split('/');
    await manageIssue(octokit, owner, repo, results, issueLabels);

    console.log('\n✅ Password leak scan completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error during scan:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the scanner
main();
