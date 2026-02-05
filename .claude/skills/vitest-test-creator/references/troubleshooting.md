# Troubleshooting

## jest-dom matchers not found

```
Property 'toBeInTheDocument' does not exist
```

**Fix:** Ensure file extension is `.browser.test.tsx` and `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`

## Multiple elements found

```
Found multiple elements with role "searchbox"
```

**Fix:** Use `container.querySelector()` instead of `screen.getByRole()`, and add `afterEach(() => cleanup())`

## Test timeout

**Fix:** Add `await` to async operations, or use `vi.waitFor()` for state updates

## React not defined

**Fix:** Add `import React from 'react'` in test file

## Chromium crash

```bash
pnpm exec playwright install chromium
```
