# Mocking Guide

## Next.js Mocks

### next/link

```typescript
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
```

### next/navigation

```typescript
vi.mock('next/navigation', () => ({
  useSelectedLayoutSegment: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/'),
}))

// In test
vi.mocked(useSelectedLayoutSegment).mockReturnValue('docs')
```

### next-themes

```typescript
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}))
```

## Reset Pattern

```typescript
beforeEach(() => vi.clearAllMocks())
```
