# Antigravity Execution Rules

These rules define the permissions and guidelines for Antigravity's autonomous operations in this repository. They inherit from and extend the global rules defined in [~/.antigravity/rules.md](file:///Users/kiyeol/.antigravity/rules.md).

## Command Execution Policy

Antigravity is authorized to use `SafeToAutoRun: true` for the following categories of commands:

### 1. Read-Only Operations
- Directory listing (`ls`, `find`, `tree`)
- File content reading (`cat`, `grep`, `awk`, `sed` for reading)
- Search operations (`grep_search`, `find_by_name`)

### 2. Development & Build Tools
- Package manager commands (`yarn install`, `yarn build`, `yarn dev`)
- Linting and formatting (`yarn lint`, `yarn format`)
- Testing commands (`yarn test`, `npm test`)

### 3. Version Control (Read)
- Checking status (`git status`, `git diff`)
- Viewing logs (`git log`)
- Checking branch information (`git branch`)

### 4. Code Generation & Analysis
- Running scripts in `scripts/` that do not modify external data
- Executing MCP tools for database schema discovery or document search

## Restrictive Operations (Always Require Approval)

The following operations MUST NOT use `SafeToAutoRun: true` and always require explicit USER approval:
- Deleting files or directories (`rm -rf`)
- Destructive git operations (`git reset --hard`, `git push --force`)
- Database migrations that drop tables or delete production data
- Installing system-level dependencies (outside of `yarn`/`npm`)
- Making external network requests to unknown domains (except documented API endpoints)

## Language Preference

- Walkthroughs, summaries, and complex explanations should be provided in **Korean (한국어)**.
- Code-related artifacts (implementation plans, task checklists) should maintain technical clarity in **English**.
