---
name: pr-create
description: GitHub Pull Request creation skill. Use when the user says "create a pull request", "create a PR", "make a PR", etc. Analyzes git commit history of the current branch to auto-generate PR title and description, then executes gh pr create command.
---

# GitHub Pull Request Creation

## Workflow

1. Check for uncommitted changes. If on main branch with changes, create a branch first
2. If uncommitted, use the commit skill to commit
3. Generate PR content from `git log --oneline origin/main..HEAD`
4. Verify branch is pushed with `git branch -vv`
5. Execute `gh pr create` and return PR URL

## PR Content Generation

See `references/pr-template.md` for template structure.

- **Title**: First commit message (Conventional Commits format)
- **Description**: Summary, Changes, Type of Change, Related Issues

## Project-Specific Rules

- Base branch: `origin/main`
- **Do not add "Generated with Claude Code" note**
