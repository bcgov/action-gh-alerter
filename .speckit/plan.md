# Technical Implementation Plan

## Architecture Overview

### Components
1. **GitHub Actions Workflow** (`.github/workflows/password-leak-scanner.yml`)
   - Triggered on schedule (daily) or manual dispatch
   - Sets up Node.js environment
   - Installs dependencies
   - Executes scanner script
   - Has access to GITHUB_TOKEN with appropriate permissions

2. **Scanner Script** (`src/scanner.js`)
   - Main orchestration logic
   - Coordinates all scanning operations
   - Handles high-level error recovery

3. **Repository Scanner Module** (`src/lib/repo-scanner.js`)
   - Lists all repositories in organizations
   - Handles pagination
   - Fetches secret scanning alerts per repository
   - Filters for password-type alerts

4. **Issue Manager Module** (`src/lib/issue-manager.js`)
   - Searches for existing alert issue
   - Creates new issue if needed
   - Updates existing issue with findings
   - Formats markdown output

5. **Rate Limiter Module** (`src/lib/rate-limiter.js`)
   - Monitors API rate limits
   - Implements waiting/throttling logic
   - Provides retry with exponential backoff

## Data Flow

```
Workflow Trigger
    ↓
Initialize Octokit Client
    ↓
For each organization (bcgov, bcgov-c):
    ↓
    List all repositories (paginated)
    ↓
    For each repository:
        ↓
        Fetch secret scanning alerts
        ↓
        Filter for password-type
        ↓
        Add to results collection
    ↓
Aggregate all results
    ↓
Format findings as markdown
    ↓
Search for existing issue
    ↓
Create or Update issue
    ↓
Output summary to workflow logs
```

## API Endpoints Used

### List Organization Repositories
```
GET /orgs/{org}/repos
```
- Pagination: ?per_page=100&page=N
- Returns: Repository list with metadata

### List Secret Scanning Alerts
```
GET /repos/{owner}/{repo}/secret-scanning/alerts
```
- Query params: ?state=open&secret_type=password
- Pagination: ?per_page=100&page=N
- Returns: Alert details

### Search Issues
```
GET /search/issues
```
- Query: `repo:{owner}/{repo} is:issue label:password-leak-scan in:title`
- Returns: Matching issues

### Create Issue
```
POST /repos/{owner}/{repo}/issues
```
- Body: { title, body, labels }

### Update Issue
```
PATCH /repos/{owner}/{repo}/issues/{issue_number}
```
- Body: { body, state }

## Error Handling Strategy

### Levels
1. **Repository-level failures**: Log and continue to next repository
2. **API rate limit**: Wait until reset, then retry
3. **Network failures**: Retry with exponential backoff (max 3 attempts)
4. **Authentication failures**: Fail fast with clear error message
5. **Issue creation failures**: Log error but mark scan as successful

### Logging
- Use GitHub Actions workflow commands for visibility
- Structure: `[LEVEL] [Component] Message`
- Levels: ERROR, WARN, INFO, DEBUG

## Configuration

### Environment Variables
- `GITHUB_TOKEN`: Authentication token (automatically provided)
- `GITHUB_REPOSITORY`: Current repository (automatically provided)
- `ORGANIZATIONS`: Comma-separated org list (default: "bcgov,bcgov-c")
- `ISSUE_LABELS`: Labels for created issues (default: "security,password-leak-scan")

### Workflow Configuration
- Schedule: `cron: '0 2 * * *'` (2 AM UTC daily)
- Timeout: 360 minutes (6 hours)
- Runner: ubuntu-latest
- Node version: 20.x

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── password-leak-scanner.yml
├── .speckit/
│   ├── specification.md
│   ├── constitution.md
│   └── plan.md
├── src/
│   ├── scanner.js (main entry point)
│   └── lib/
│       ├── repo-scanner.js
│       ├── issue-manager.js
│       └── rate-limiter.js
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
└── LICENSE
```

## Implementation Phases

### Phase 1: Core Infrastructure
- [x] Create Spec-Kit documentation
- [ ] Create package.json with dependencies
- [ ] Create directory structure
- [ ] Set up basic workflow file

### Phase 2: Scanner Implementation
- [ ] Implement repository lister
- [ ] Implement secret scanning API integration
- [ ] Add password-type filtering
- [ ] Implement pagination handling

### Phase 3: Rate Limiting & Reliability
- [ ] Add rate limit detection
- [ ] Implement retry logic
- [ ] Add error handling
- [ ] Add logging

### Phase 4: Issue Management
- [ ] Implement issue search
- [ ] Implement issue creation
- [ ] Implement issue update
- [ ] Format results as markdown

### Phase 5: Testing & Documentation
- [ ] Test workflow locally with act (if available)
- [ ] Update README with usage instructions
- [ ] Add configuration examples
- [ ] Run security checks

## Testing Strategy

### Manual Testing
1. Test with small organization first
2. Verify rate limiting behavior
3. Test issue creation and updates
4. Verify filtering works correctly
5. Test error scenarios (invalid token, missing permissions)

### Validation Checklist
- [ ] Workflow syntax is valid
- [ ] Required permissions are documented
- [ ] Rate limiting is handled
- [ ] Errors are logged appropriately
- [ ] Issue format is readable
- [ ] Summary statistics are accurate
