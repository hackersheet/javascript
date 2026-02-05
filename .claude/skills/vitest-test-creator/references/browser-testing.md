# Browser Testing Guide

## Required Pattern

```typescript
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Component', () => {
  afterEach(() => cleanup())  // REQUIRED

  it('handles click', async () => {
    const user = userEvent.setup()
    const { container } = render(<Component />)

    // Use querySelector instead of screen.getByRole
    const button = container.querySelector('button')
    await user.click(button!)

    expect(container.querySelector('[data-result]')).toBeInTheDocument()
  })
})
```

## Key Points

- **Always `afterEach(() => cleanup())`** - Prevents DOM sharing between tests
- **Use `container.querySelector()`** - Avoids "multiple elements found" errors
- **Use `userEvent.setup()`** - Not `fireEvent`
- **jest-dom matchers** - `toBeInTheDocument()`, `toHaveClass()`, `toBeDisabled()`

## Hooks Testing

```typescript
import { renderHook, act } from '@testing-library/react';

it('toggles state', () => {
  const { result } = renderHook(() => useToggle());
  act(() => result.current.toggle());
  expect(result.current.value).toBe(true);
});
```
