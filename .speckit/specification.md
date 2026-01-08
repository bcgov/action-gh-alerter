# Password Leak Scanner Specification

## Overview
An automated GitHub Actions workflow that monitors all accessible repositories in the `bcgov` and `bcgov-c` organizations for password leaks using GitHub's Secret Scanning API.

## Problem Statement
Organizations need continuous monitoring of their repositories for exposed passwords and credentials. Manual checking across 100+ repositories is inefficient and error-prone. This system provides automated, scheduled scanning with centralized reporting.

## Goals
- Automate detection of password leaks across all organization repositories
- Provide centralized visibility through GitHub Issues
- Enable email notifications to security teams via GitHub Issue subscriptions
- Handle large-scale scanning (100+ repositories) reliably

## Target Users
- Security teams in bcgov and bcgov-c organizations
- DevOps engineers monitoring credential exposure
- Compliance officers tracking security incidents

## Core Features

### 1. Repository Scanning
- Scan all accessible repositories in `bcgov` organization
- Scan all accessible repositories in `bcgov-c` organization
- Use GitHub's Secret Scanning API for detection
- Filter alerts to only password-type secrets (`secret_type=password`)
- Handle pagination for large organization repository lists

### 2. Results Aggregation
- Collect all password leak alerts across repositories
- Group findings by repository
- Include alert metadata (state, created date, URL)
- Calculate summary statistics

### 3. Issue Management
- Create a new GitHub issue if none exists
- Update existing issue with latest findings
- Include timestamp of last scan
- Format results in readable markdown tables
- Add labels for categorization

### 4. Reliability Features
- Implement rate limiting compliance with GitHub API
- Add retry logic for transient failures
- Handle API errors gracefully
- Log progress and errors for debugging
- Continue scanning on individual repository failures

### 5. Scheduling
- Run automatically on a daily schedule
- Support manual trigger for ad-hoc scans
- Configurable schedule via workflow dispatch

## Constraints

### Technical Constraints
- Must use GitHub Actions as execution environment
- Must authenticate using GITHUB_TOKEN or PAT with appropriate scopes
- Must comply with GitHub API rate limits (5000 requests/hour for authenticated)
- Must work with GitHub-hosted runners (ubuntu-latest)

### Scope Constraints
- Only scans for password-type secrets (not all secret types)
- Only scans `bcgov` and `bcgov-c` organizations
- Creates issues in the same repository where workflow runs
- Does not auto-remediate findings (reporting only)

## Success Criteria
- Successfully scans all accessible repositories in both organizations
- Correctly filters for password-type secrets only
- Creates/updates issue with accurate findings
- Completes scan within GitHub Actions timeout (6 hours max)
- Handles rate limiting without failures
- Zero data loss (all alerts captured)

## Out of Scope
- Scanning other organizations
- Auto-remediation of found secrets
- Historical trend analysis
- Integration with external alerting systems
- Custom secret pattern definitions
- Scanning of non-password secret types (unless explicitly configured)

## API Requirements
Token must have:
- `repo` scope (for repository access)
- `security_events` scope (for secret scanning API access)
- Organization membership or appropriate permissions
