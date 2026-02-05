# jest-dom Setup

## Configuration

1. `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

2. `vitest.config.mts` (browser project):

```typescript
setupFiles: ['./vitest.setup.ts']
```

**Note:** Only works with `.browser.test.tsx` files.
