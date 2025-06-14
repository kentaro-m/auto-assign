# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub App built with Probot that automatically adds reviewers and assignees to pull requests when they are opened. It listens for `pull_request.opened` and `pull_request.ready_for_review` events and assigns reviewers/assignees based on configuration in `.github/auto_assign.yml`.

## Key Architecture

- **Entry Point**: `src/index.ts` registers event handlers for pull request events
- **Main Handler**: `src/handler.ts:handlePullRequest()` processes pull request events and applies reviewer/assignee logic
- **Utilities**: `src/util.ts` contains core logic for selecting users from groups, handling teams vs individual users, and filtering

The app supports:
- Single reviewer lists vs grouped reviewers (teams/departments)
- GitHub teams using `org/team_slug` or `/team_slug` syntax
- Skip keywords to bypass assignment on certain PRs
- Skip users (e.g., dependabot) from assignment process
- Author assignment as assignee

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the app locally
npm start

# Development with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run coverage

# Watch tests during development
npm run test:watch

# Lint code
npm run lint
```

## Testing

- Test files are in `/test/` directory
- Uses Jest with ts-jest for TypeScript support
- Test configuration in `jest.config.js`
- Example PR data in `test/pull_request_data/example_pr_response.json`

## Build Output

- TypeScript compiles to `/lib/` directory
- Source maps generated for debugging
- Declaration files (.d.ts) generated for type information