# Playwright Testing with GitHub Actions

This repository includes a GitHub Actions workflow that automatically runs Playwright tests on every push and pull request.

## Workflow Features

The workflow (`/.github/workflows/playwright.yml`) includes:

- **Automated Testing**: Runs on pushes and PRs to `main` and `develop` branches
- **Browser Testing**: Uses Chromium browser for consistent cross-platform results
- **Artifact Collection**: Automatically captures and uploads:
  - Test results (screenshots, videos, traces)
  - HTML reports with detailed test outcomes
  - 30-day retention for all artifacts

## Video and Screenshot Capture

The tests are configured to capture:
- **Screenshots**: On test failures only (saves space)
- **Videos**: On test failures in CI environment
- **Traces**: On test retries for debugging

## Local Development

For local testing with full Spotify functionality:

1. Copy `.env.test.template` to `.env.test`
2. Follow the instructions in the template to add your Spotify tokens
3. Run tests locally: `npm test`

## Test Structure

- `tests/health-check.spec.js`: Basic page navigation and UI element tests
- `tests/kids-controls.spec.js`: Interactive tests for the kids player interface
- `tests/auth-helper.js`: Authentication utilities for tests

Tests are designed to work with or without real Spotify credentials, falling back to mock authentication when needed.