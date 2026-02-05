# Test Workflow

## Commands

```bash
# Single file
pnpm test:run src/components/__tests__/Button.browser.test.tsx

# Pattern match
pnpm test:run bookmark

# All tests
pnpm test:run

# Coverage
pnpm test:coverage
```

## After Creating Tests

```bash
pnpm test:run <file>
pnpm lint <file>
pnpm check
```
