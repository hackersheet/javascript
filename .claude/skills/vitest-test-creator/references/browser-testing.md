# ブラウザテスト完全ガイド

## 基本構造

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TargetComponent } from '../TargetComponent'

describe('TargetComponent', () => {
  beforeEach(() => {
    // 各テスト前のセットアップ
  })

  afterEach(() => {
    // 各テスト後のクリーンアップ
    cleanup()
  })

  it('期待する動作を説明', async () => {
    // Arrange（準備）
    const user = userEvent.setup()
    const { container } = render(<TargetComponent />)

    // Act（実行）
    const button = container.querySelector('button')
    await user.click(button!)

    // Assert（検証）- jest-dom マッチャー推奨
    expect(container.querySelector('[data-result]')).toBeInTheDocument()
  })
})
```

## テスト例

### コンポーネント表示テスト

```typescript
describe('Button', () => {
  afterEach(() => cleanup())

  it('ラベルを表示する', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
    expect(button?.textContent).toBe('Click me')
  })
})
```

### クリックイベントテスト

```typescript
describe('Button', () => {
  afterEach(() => cleanup())

  it('クリックでonClickを呼び出す', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(<Button onClick={onClick}>Click</Button>)
    const button = container.querySelector('button')

    expect(button).toBeInTheDocument()
    await user.click(button!)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### フォーム入力テスト

```typescript
describe('SearchInput', () => {
  afterEach(() => cleanup())

  it('入力値が状態に反映される', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const { container } = render(<SearchInput onChange={onSearchChange} />)

    const input = container.querySelector('input[type="search"]')
    await user.type(input!, 'test')

    expect(onSearchChange).toHaveBeenCalledWith('test')
  })
})
```

### disabled状態テスト

```typescript
describe('Button', () => {
  afterEach(() => cleanup())

  it('disabled時はクリックできない', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(<Button onClick={onClick} disabled>Click</Button>)
    const button = container.querySelector('button')

    expect(button).toBeDisabled()
    await user.click(button!)
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

## カスタム Hooks のテスト

Hooks は DOM 操作を含むため、ブラウザテストを使用：

```typescript
// src/hooks/__tests__/useTheme.browser.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  it('テーマの状態を返す', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('テーマを切り替える', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
  })
})
```

## 推奨される API

### 要素取得

```typescript
// ✅ 推奨: CSS セレクタで明確に指定
const button = container.querySelector('button')
const inputs = container.querySelectorAll('input[type="search"]')
```

### ユーザーイベント（推奨）

```typescript
const user = userEvent.setup()

// クリック
await user.click(button!)

// テキスト入力
await user.type(input!, 'text')

// キーボード操作
await user.keyboard('{Enter}')

// フォーム送信
await user.submit(form!)
```

### jest-dom マッチャー（推奨）

```typescript
expect(element).toBeInTheDocument() // DOM に存在
expect(element).toHaveAttribute('name', 'keyword') // 属性確認
expect(element).toHaveClass('text-base') // クラス名確認
expect(element).toBeVisible() // 表示状態
expect(element).toBeDisabled() // disabled 確認
expect(element).toBeChecked() // checked 確認
```

## ベストプラクティス

### 1. 各テスト後に cleanup() を呼ぶ

```typescript
describe('Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('test1', () => {
    render(<Component />)
  })

  it('test2', () => {
    render(<Component />)
  })
})
```

複数のテストが DOM を共有しないようにするため重要。

### 2. userEvent で実際の動作に近いテストを

```typescript
// Good: 実際のユーザー操作をシミュレート
const user = userEvent.setup()
await user.click(button!)
await user.type(input!, 'text')

// Bad: fireEvent はブラウザの実装詳細を無視
fireEvent.click(button!)
```

### 3. container.querySelector() で明確に指定

```typescript
// Good: 要素が一意に特定される
const button = container.querySelector('button[data-test="submit"]')

// 複数あると失敗する（screen.getByRole で複数見つかる場合の回避）
const input = container.querySelector('input[type="search"]')
```

### 4. jest-dom マッチャーを活用

```typescript
// Good: jest-dom マッチャーで可読性向上
expect(input).toBeInTheDocument()
expect(input).toHaveAttribute('name', 'keyword')
expect(input).toHaveClass('text-base')

// Bad: 標準マッチャーのみ（冗長）
expect(input).toBeTruthy()
expect(input.getAttribute('name')).toBe('keyword')
expect(input.className).toContain('text-base')
```

### 5. Props のバリエーション をテスト

```typescript
describe('Button', () => {
  afterEach(() => cleanup())

  it('primary 色で表示される', () => {
    const { container } = render(<Button variant="primary">Click</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-blue')
  })

  it('secondary 色で表示される', () => {
    const { container } = render(<Button variant="secondary">Click</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-gray')
  })
})
```

### 6. 非同期処理のテスト

```typescript
it('データロード中に loading を表示する', async () => {
  const user = userEvent.setup()
  const { container } = render(<DataFetcher />)

  expect(container.querySelector('[data-loading]')).toBeInTheDocument()

  // ローディング完了を待つ
  await vi.waitFor(() => {
    expect(container.querySelector('[data-content]')).toBeInTheDocument()
  })
})
```

## テスト作成チェックリスト

- [ ] テストファイルが正しい場所に配置されているか（`__tests__/` ディレクトリ）
- [ ] ファイル名が `.browser.test.tsx` か確認
- [ ] `afterEach(() => cleanup())` が実装されているか
- [ ] `render()` で正しくコンポーネントをレンダリングしているか
- [ ] `container.querySelector()` で要素を明確に指定しているか
- [ ] `userEvent.setup()` でユーザーイベントをシミュレートしているか
- [ ] jest-dom マッチャーを活用しているか
- [ ] Props のバリエーションをテストしているか
- [ ] 非同期処理に `await` と `vi.waitFor()` を使用しているか
- [ ] テスト名から振る舞いを予測できるか
