# Commit Message Rules

## Project-Specific Conventions

### Type Selection

- Use `test` for test code modifications/refactoring (not `refactor`)

### Scope

- Use kebab-case (e.g., `commit-skill`, `user-profile`, `api-client`)
- Apply meaningful scope names, not file paths or file names
- Use only one scope. Split commits if multiple are needed

### Body

- **Include body by default**
- Use list format with `-` prefix
- Describe changed files and specific changes
- Include technical details and implementation approach

**Body can be omitted only when:**

- The summary completely explains the changes
- Additional details would duplicate the summary (e.g., simple typo fix)

## Examples

Example with file-specific changes:

```text
feat(auth): add remember me feature to login

- src/components/LoginForm.tsx: Add remember me checkbox
- src/hooks/useAuth.ts: Implement token persistence logic
- src/lib/storage.ts: Add localStorage operation utilities
- Save token to localStorage when remember me is enabled
- Set expiration to 30 days
```

Example where body can be omitted:

```text
fix(typo): fix typo in README.md
```
