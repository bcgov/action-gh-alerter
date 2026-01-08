# Development Constitution

## Core Principles

### 1. Reliability First
- All code must handle errors gracefully
- Never fail silently - log all errors
- Use retry logic for transient failures
- Validate inputs before processing
- Test error paths as thoroughly as happy paths

### 2. Security by Default
- Never log sensitive data (tokens, secrets)
- Use environment variables for credentials
- Follow principle of least privilege for API scopes
- Validate and sanitize all external inputs
- Keep dependencies minimal and up-to-date

### 3. Maintainability
- Code should be self-documenting with clear variable names
- Add comments only for complex logic or non-obvious decisions
- Follow consistent code style throughout
- Keep functions small and focused (single responsibility)
- Use TypeScript or clear JSDoc annotations for JavaScript

### 4. GitHub Actions Best Practices
- Use official actions where possible
- Pin action versions with SHA for security
- Minimize workflow execution time
- Use appropriate runner types (ubuntu-latest default)
- Cache dependencies when beneficial

### 5. API Usage
- Respect rate limits proactively
- Implement exponential backoff for retries
- Use pagination correctly for all list endpoints
- Handle partial failures gracefully
- Minimize API calls where possible

### 6. Testing Philosophy
- Test the integration with GitHub API (can use mocks)
- Validate error handling paths
- Test rate limiting logic
- Verify issue creation/update logic
- Use meaningful test data

### 7. Documentation Standards
- README must include setup instructions
- Document required permissions and scopes
- Provide configuration examples
- Include troubleshooting section
- Keep specification documents synchronized with code

## Technology Choices

### Language
- **Node.js/JavaScript**: Native GitHub Actions support, rich ecosystem for API clients

### Dependencies
- **@octokit/rest**: Official GitHub API client
- **@octokit/plugin-retry**: Automatic retry logic
- **@octokit/plugin-throttling**: Rate limit handling
- Minimize other dependencies to reduce attack surface

### Code Style
- Use modern JavaScript (ES6+)
- Prefer async/await over callbacks
- Use const/let, never var
- Use template literals for string formatting
- Follow StandardJS or ESLint recommended rules

## Quality Gates
Before merging:
1. All code must pass linting
2. Security scan must be clean
3. Workflow must validate successfully
4. README must be updated
5. Specification documents must be current
