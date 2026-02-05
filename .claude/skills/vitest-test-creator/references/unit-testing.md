# Unit Testing Guide

## Basic Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('functionName', () => {
  it('describes behavior', () => {
    expect(functionName(input)).toBe(expected);
  });
});
```

## Table-Driven Tests

```typescript
const cases = [
  { input: 'a', expected: 'A', desc: 'uppercase' },
  { input: '1', expected: '1', desc: 'number unchanged' },
];

cases.forEach(({ input, expected, desc }) => {
  it(desc, () => expect(transform(input)).toBe(expected));
});
```
