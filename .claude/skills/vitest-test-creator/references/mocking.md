# モック完全ガイド

## 基本的なモック

### 関数モック

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockImplementation((x) => x * 2)
```

### モジュールモック

```typescript
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}))
```

### スパイ

```typescript
const spy = vi.spyOn(object, 'method')
```

### リセット

```typescript
import { beforeEach } from 'vitest'

beforeEach(() => {
  vi.clearAllMocks() // 呼び出し履歴をクリア
})
```

## ユニットテストでのモック例

```typescript
// ユーティリティ関数のユニットテスト（.unit.test.ts）
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { fetchUserData } from './fetch-user'

// モジュール全体をモック
vi.mock('./api', () => ({
  fetchFromAPI: vi.fn(),
}))

describe('fetchUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('APIからユーザーデータを取得する', async () => {
    const { fetchFromAPI } = await import('./api')
    vi.mocked(fetchFromAPI).mockResolvedValueOnce({ id: 1, name: 'Test' })

    const result = await fetchUserData(1)
    expect(result).toEqual({ id: 1, name: 'Test' })
  })
})
```

## ブラウザテストでのモック例

```typescript
// React コンポーネントのブラウザテスト（.browser.test.tsx）
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { UserProfile } from './UserProfile'

// 外部ライブラリをモック
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}))

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('ユーザー情報を表示する', () => {
    render(<UserProfile userId={1} />)
  })
})
```

## Next.js 関連のモック

### next/link のモック

```typescript
import { PropsWithChildren } from 'react'

interface MockLinkProps extends PropsWithChildren {
  href: string
  className?: string
}

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: MockLinkProps) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))
```

### next/navigation hooks のモック

```typescript
import { useSelectedLayoutSegment } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegment: vi.fn(),
}))

const mockUseSelectedLayoutSegment = vi.mocked(useSelectedLayoutSegment)

describe('Component', () => {
  beforeEach(() => {
    mockUseSelectedLayoutSegment.mockReturnValue('docs')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
})
```

## 非同期テスト

```typescript
describe('fetchData', () => {
  it('データを取得する', async () => {
    const data = await fetchData()
    expect(data).toEqual({ id: 1, name: 'Test' })
  })

  it('エラー時に例外をスローする', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    await expect(fetchData()).rejects.toThrow('Network error')
  })
})
```

## ベストプラクティス

### 1. モックは最小限に

```typescript
// Good: 必要な依存のみモック
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}))

// Bad: すべてをモック
vi.mock('./api')
vi.mock('./db')
vi.mock('./logger')
```

### 2. beforeEach で毎回リセット

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### 3. vi.mocked() で型付きモック

```typescript
// Good: 型チェック可能
const mockFetch = vi.mocked(fetch)
mockFetch.mockReturnValue(...)
```
