# Test File Placement

## Directory Structure

Test files go in `__tests__/` directory at the same level as target file:

```text
src/
├── utils/
│   ├── __tests__/
│   │   └── format-date.unit.test.ts
│   └── format-date.ts
├── components/
│   ├── Button/
│   │   ├── __tests__/
│   │   │   └── Button.browser.test.tsx
│   │   └── Button.tsx
└── hooks/
    ├── __tests__/
    │   └── useTheme.browser.test.ts
    └── useTheme.ts
```

## File Naming

| Location                | Extension           |
| ----------------------- | ------------------- |
| `utils/`, `lib/`        | `.unit.test.ts`     |
| `components/`, `hooks/` | `.browser.test.tsx` |

## Vitest Auto-Detection

```typescript
// Unit tests (Node.js)
include: ['**/__tests__/**/*.unit.{test,spec}.ts'];

// Browser tests (Playwright)
include: ['**/__tests__/**/*.browser.{test,spec}.ts{,x}'];
```
