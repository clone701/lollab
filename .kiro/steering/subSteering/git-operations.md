# Git Operations Guidelines

## Overview

This steering document defines the standardized Git workflow for committing changes and creating pull requests. This document should only be referenced when users request Git-related operations.

## Standard Branch Creation Workflow

When a user requests "XXブランチを作成して" (create XX branch), follow this exact sequence:

### Step 1: Fetch Latest Changes
```bash
git fetch origin
```

### Step 2: Switch to Main Branch
```bash
git checkout main
```

### Step 3: Pull Latest Main
```bash
git pull origin main
```

### Step 4: Create New Branch from Main
```bash
git checkout -b [branch-name]
```

**Complete Command Sequence:**
```bash
git fetch origin ; git checkout main ; git pull origin main ; git checkout -b [branch-name]
```

## Standard Commit Workflow

When a user requests "コミットして" (commit), follow this exact sequence:

### Step 1: Stage Changes and Verify Status
```bash
git add . ; git status
```

**Review the output carefully:**
- Ensure all intended files are staged
- Check for any unexpected files
- Verify no sensitive information is included

### Step 2: Commit Changes
Only proceed if Step 1 shows no issues:
```bash
git commit -m "descriptive commit message"
```

**Commit Message Format:**
- Use format: `[branch-name] type: Japanese description`
- Example: `kiro-1 feat: Git操作ガイドラインを追加`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep description concise but descriptive in Japanese
- Include branch name prefix for traceability

### Step 3: Create Pull Request
After successful commit, create a pull request:
```bash
git push origin [current-branch-name]
```

Then guide the user to create a pull request through their Git platform interface.

## Error Handling

### If git add fails:
- Check file permissions
- Verify repository status
- Report specific error to user

### If git status shows issues:
- **DO NOT PROCEED** with commit
- Report issues to user
- Wait for user confirmation before continuing

### If git commit fails:
- Check Git configuration (user.name, user.email)
- Verify commit message format
- Report specific error to user

## Git Configuration Requirements

Ensure Git is properly configured before any operations:
```bash
git config user.name "LoL Lab Developer"
git config user.email "developer@lollab.local"
```

## Branch Management

### Current Branch Verification
Always verify current branch before operations:
```bash
git branch
```

### Branch Naming Convention
- Use descriptive names: `feature/description`, `fix/issue-name`, `kiro-1`, etc.
- Avoid spaces and special characters
- Use lowercase with hyphens

## Security Considerations

### Before Staging (git add):
- **NEVER** commit sensitive information:
  - API keys, passwords, tokens
  - Personal information
  - Database credentials
  - Environment files (.env)

### File Review Checklist:
- [ ] No sensitive data in staged files
- [ ] All files are intentionally included
- [ ] No temporary or cache files
- [ ] Documentation is up to date

## Pull Request Guidelines

### PR Title Format:
- Use same format as commit messages: `[branch-name] type: Japanese description`
- Be descriptive and concise in Japanese

### PR Description Should Include:
- Summary of changes
- Reason for changes
- Any breaking changes
- Testing performed

## Automation Rules

### When User Says "XXブランチを作成して":
1. **MUST** execute git fetch origin ; git checkout main ; git pull origin main ; git checkout -b [branch-name]
2. **MUST** verify branch creation was successful
3. **MUST** confirm current branch is the newly created one
4. **SHOULD** inform user of successful branch creation

### When User Says "コミットして":
1. **MUST** execute git add . ; git status
2. **MUST** review output carefully for any issues
3. **MUST** only proceed if status is clean
4. **MUST** execute git commit with appropriate message
5. **SHOULD** offer to create pull request

### Error Response:
- Report errors in Japanese to user
- Provide specific error details
- Suggest corrective actions
- Do not proceed without user confirmation

## Integration with Development Workflow

This Git workflow integrates with the 5-phase AI coding workflow:
- Use after completing each phase
- Commit incremental progress
- Create feature branches for major changes
- Merge to main only after review

## Environment-Specific Notes

### Windows PowerShell:
- Use full Git path if needed: `"C:\Program Files\Git\bin\git.exe"`
- Set PATH environment variable: `$env:PATH += ";C:\Program Files\Git\bin"`
- Handle PowerShell command parsing carefully

### Command Execution:
- Always verify Git is available before operations
- Handle path issues gracefully
- Provide clear error messages in Japanese