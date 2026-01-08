# Password Leak Scanner for GitHub Organizations

Automated GitHub Actions workflow that scans all accessible repositories in bcgov and bcgov-c organizations for password leaks using GitHub's Secret Scanning API.

## Features

- 🔍 **Automated Scanning**: Daily scheduled scans of all organization repositories
- 🔐 **Password-Specific Detection**: Filters alerts to only password-type secrets
- 📊 **Centralized Reporting**: Aggregates results into a single GitHub Issue
- 📧 **Email Notifications**: Subscribe to the issue to receive alerts
- 🛡️ **Rate Limiting**: Handles GitHub API rate limits gracefully
- 🏢 **Multi-Organization**: Scans both bcgov and bcgov-c organizations
- ⚡ **Scalable**: Efficiently handles 100+ repositories

## How It Works

1. **Scheduled Execution**: Runs daily at 2 AM UTC (or on-demand via workflow_dispatch)
2. **Repository Discovery**: Lists all repositories in configured organizations
3. **Secret Scanning**: Queries GitHub's Secret Scanning API for each repository
4. **Filtering**: Extracts only password-type secret alerts
5. **Aggregation**: Collects all findings across repositories
6. **Issue Management**: Creates or updates a GitHub Issue with formatted results
7. **Notifications**: Anyone subscribed to the issue receives email updates

## Setup

### Prerequisites

- GitHub repository with Actions enabled
- GitHub token with required permissions (automatically provided via `GITHUB_TOKEN`)
- Access to bcgov and bcgov-c organizations

### Required Permissions

The workflow requires the following permissions:

```yaml
permissions:
  contents: read          # To checkout the repository
  issues: write          # To create/update issues
  security-events: read  # To access secret scanning alerts
```

**Note**: The default `GITHUB_TOKEN` may need additional organization-level permissions to access organization repositories and their secret scanning data. You may need to use a Personal Access Token (PAT) with appropriate scopes:

- `repo` - Full control of private repositories
- `read:org` - Read organization membership
- `security_events` - Read security events

### Installation

1. **Clone or fork this repository**

2. **Install dependencies** (for local testing):
   ```bash
   npm install
   ```

3. **Configure organizations** (optional):
   
   Edit `.github/workflows/password-leak-scanner.yml` to change default organizations:
   ```yaml
   ORGANIZATIONS: 'bcgov,bcgov-c'  # Comma-separated list
   ```

4. **Enable the workflow**:
   
   The workflow is automatically enabled once committed to the repository.

### Using a Personal Access Token

If you need more permissions than the default `GITHUB_TOKEN` provides:

1. Create a PAT with required scopes at: https://github.com/settings/tokens
2. Add it as a repository secret named `ORG_ACCESS_TOKEN`
3. Update the workflow to use it:
   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.ORG_ACCESS_TOKEN }}
   ```

## Usage

### Automatic Scanning

The workflow runs automatically every day at 2 AM UTC. No action required.

### Manual Scanning

To trigger a scan manually:

1. Go to the **Actions** tab in your repository
2. Select **Password Leak Scanner** workflow
3. Click **Run workflow**
4. (Optional) Specify custom organizations
5. Click **Run workflow** button

### Viewing Results

Results are published as a GitHub Issue in the same repository:

1. Go to the **Issues** tab
2. Look for issue titled: **🔐 Password Leak Scan Report**
3. The issue contains:
   - Summary statistics
   - List of repositories with password leaks
   - Direct links to each alert
   - Timestamp of last scan

### Email Notifications

To receive email notifications when password leaks are detected:

1. Navigate to the Password Leak Scan Report issue
2. Click **Subscribe** button (bell icon)
3. You'll receive emails when the issue is updated with new findings

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ORGANIZATIONS` | Comma-separated list of GitHub organizations to scan | `bcgov,bcgov-c` |
| `ISSUE_LABELS` | Labels to apply to the report issue | `security,password-leak-scan` |
| `GITHUB_TOKEN` | Authentication token (automatically provided) | - |

### Workflow Schedule

To change the scan frequency, edit the cron expression in `.github/workflows/password-leak-scanner.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Examples:
- Every 12 hours: `0 */12 * * *`
- Every Monday: `0 2 * * 1`
- Twice daily (2 AM and 2 PM): `0 2,14 * * *`

## Architecture

### Project Structure

```
.
├── .github/
│   └── workflows/
│       └── password-leak-scanner.yml  # GitHub Actions workflow
├── .speckit/                          # Spec-Kit documentation
│   ├── specification.md               # Requirements and features
│   ├── constitution.md                # Development principles
│   └── plan.md                        # Technical implementation plan
├── src/
│   ├── scanner.js                     # Main entry point
│   └── lib/
│       ├── repo-scanner.js            # Repository scanning logic
│       └── issue-manager.js           # GitHub Issue management
├── package.json                       # Node.js dependencies
└── README.md                          # This file
```

### Specifications (Spec-Kit)

This project follows spec-driven development using [GitHub Spec-Kit](https://github.com/github/spec-kit). Detailed specifications can be found in the `.speckit/` directory:

- **specification.md**: Complete requirements, features, and constraints
- **constitution.md**: Development principles and technology choices
- **plan.md**: Technical architecture and implementation details

## Troubleshooting

### "Resource not accessible by integration" error

**Problem**: The workflow fails with permission errors.

**Solution**: 
- Ensure workflow has correct permissions in YAML file
- Use a PAT with appropriate scopes if `GITHUB_TOKEN` is insufficient
- Verify organization membership and access rights

### No alerts found but secrets exist

**Problem**: Known secrets are not detected by the scanner.

**Solution**:
- Verify GitHub Secret Scanning is enabled for the repository
- Check that alerts are `open` state (resolved alerts are excluded)
- Confirm the secret type is categorized as `password` by GitHub

### Rate limit errors

**Problem**: Workflow hits GitHub API rate limits.

**Solution**:
- The workflow includes automatic retry logic
- For very large organizations, consider reducing scan frequency
- Use a PAT which typically has higher rate limits than `GITHUB_TOKEN`

### Incomplete scans

**Problem**: Not all repositories are scanned.

**Solution**:
- Check workflow logs for specific errors
- Verify access permissions to all organization repositories
- Increase workflow timeout if needed (currently 6 hours)

## Security Considerations

- The scanner only **reads** secret scanning alerts, it does not access the actual secret values
- All authentication uses GitHub tokens (no secrets stored)
- Failed scans are logged but don't expose sensitive information
- Results are published to a GitHub Issue (ensure appropriate repository access controls)

## Contributing

Contributions are welcome! Please ensure:

1. Spec-Kit documents are updated if changing requirements
2. Code follows existing style and conventions
3. Error handling is comprehensive
4. Changes are tested

## License

Copyright 2024 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Support

For issues or questions:
- Open a GitHub Issue in this repository
- Review the [troubleshooting section](#troubleshooting)
- Check the [Spec-Kit documentation](.speckit/) for detailed technical information
