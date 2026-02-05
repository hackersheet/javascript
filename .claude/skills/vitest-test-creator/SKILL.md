---
name: vitest-test-creator
description: Test code creation, refactoring, and debugging with Vitest. Supports unit tests (.unit.test.ts) and React component/Hooks tests (.browser.test.tsx). Use when the user says "write tests", "add test cases", "refactor tests", "fix this test according to guidelines", etc. Use for creating, editing, or improving .test.ts/.test.tsx files.
---

# Vitest Test Creator

## Project-Specific Test Types

| Test Type        | File Pattern         | Environment           | Target                             |
| ---------------- | -------------------- | --------------------- | ---------------------------------- |
| **Unit Test**    | `*.unit.test.ts`     | Node.js               | Pure functions in `utils/`, `lib/` |
| **Browser Test** | `*.browser.test.tsx` | Playwright (Chromium) | React components, hooks            |

See [file-layout.md](references/file-layout.md) for placement rules.

## Key Guidelines

- **Always call `cleanup()` in `afterEach`** for browser tests
- **Use `container.querySelector()`** instead of `screen.getByRole()` to avoid multiple element errors
- **jest-dom matchers** require `.browser.test.tsx` extension and `vitest.setup.ts` import

## References

- [file-layout.md](references/file-layout.md) - Test file placement
- [browser-testing.md](references/browser-testing.md) - Browser test patterns
- [unit-testing.md](references/unit-testing.md) - Unit test patterns
- [mocking.md](references/mocking.md) - Next.js mocking patterns
- [test-data-factories.md](references/test-data-factories.md) - fishery + faker usage
- [troubleshooting.md](references/troubleshooting.md) - Common errors
