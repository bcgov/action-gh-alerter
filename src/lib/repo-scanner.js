/**
 * Repository Scanner Module
 * Scans organizations for repositories and their secret scanning alerts
 */

/**
 * Scans all repositories in specified organizations for password leaks
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string[]} organizations - Array of organization names to scan
 * @returns {Object} Scan results with alerts grouped by repository
 */
async function scanRepositories(octokit, organizations) {
  const results = {
    alerts: [],
    totalRepos: 0,
    reposWithAlerts: 0,
    totalAlerts: 0,
    failedRepos: 0,
    errors: [],
    scannedAt: new Date().toISOString()
  };

  for (const org of organizations) {
    console.log(`\n🏢 Scanning organization: ${org}`);
    
    try {
      // Get all repositories in the organization
      const repos = await listAllRepositories(octokit, org);
      console.log(`   Found ${repos.length} repositories`);
      results.totalRepos += repos.length;

      // Scan each repository for password leaks
      for (const repo of repos) {
        try {
          const alerts = await getPasswordLeakAlerts(octokit, org, repo.name);
          
          if (alerts.length > 0) {
            console.log(`   ⚠️  ${repo.name}: ${alerts.length} password leak(s) found`);
            results.alerts.push({
              org,
              repo: repo.name,
              url: repo.html_url,
              alerts: alerts
            });
            results.reposWithAlerts++;
            results.totalAlerts += alerts.length;
          }
        } catch (error) {
          results.failedRepos++;
          const errorMsg = `Failed to scan ${org}/${repo.name}: ${error.message}`;
          console.error(`   ❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to list repositories for ${org}: ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      results.errors.push(errorMsg);
    }
  }

  return results;
}

/**
 * Lists all repositories in an organization with pagination
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @returns {Array} Array of repository objects
 */
async function listAllRepositories(octokit, org) {
  const repos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await octokit.repos.listForOrg({
        org,
        type: 'all',
        per_page: 100,
        page
      });

      repos.push(...response.data);
      
      // Check if there are more pages
      hasMore = response.data.length === 100;
      page++;
      
      // Small delay to avoid rate limiting
      if (hasMore) {
        await sleep(100);
      }
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Organization '${org}' not found or not accessible`);
      }
      throw error;
    }
  }

  return repos;
}

/**
 * Gets password leak alerts for a specific repository
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner/organization
 * @param {string} repo - Repository name
 * @returns {Array} Array of password leak alert objects
 */
async function getPasswordLeakAlerts(octokit, owner, repo) {
  const alerts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      // As of August 2024, the secret_type parameter supports filtering for 'password'
      // See: https://github.blog/changelog/2024-08-06-secret-scanning-alerts-for-non-provider-patterns-and-passwords-are-retrievable-with-the-rest-api/
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/secret-scanning/alerts',
        {
          owner,
          repo,
          state: 'open',
          secret_type: 'password',
          per_page: 100,
          page
        }
      );

      // The API filter should return only password alerts, but we validate to ensure
      // accuracy in case the API returns unexpected results or the format varies
      const passwordAlerts = response.data.filter(
        alert => alert.secret_type === 'password' || 
                 (alert.secret_type_display_name && 
                  alert.secret_type_display_name.toLowerCase().includes('password'))
      );

      alerts.push(...passwordAlerts);
      
      // Check if there are more pages
      hasMore = response.data.length === 100;
      page++;
      
      // Small delay to avoid rate limiting
      if (hasMore) {
        await sleep(100);
      }
    } catch (error) {
      // If secret scanning is not enabled or not accessible, return empty array
      if (error.status === 404 || error.status === 403) {
        return [];
      }
      throw error;
    }
  }

  return alerts;
}

/**
 * Sleep utility for rate limiting
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  scanRepositories
};
