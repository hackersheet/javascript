# トラブルシューティング完全ガイド

## jest-dom マッチャーが見つからない

### エラー

```
Property 'toBeInTheDocument' does not exist on type 'Assertion<HTMLElement>'
```

### 原因

jest-dom マッチャーがセットアップされていない。

### 確認事項

- [ ] テストファイルが `.browser.test.tsx` 拡張子になっているか（ユニットテストは `.unit.test.ts`）
- [ ] `vitest.config.mts` で ブラウザテストプロジェクトに `setupFiles: ['./vitest.setup.ts']` が設定されているか
- [ ] `vitest.setup.ts` に `import '@testing-library/jest-dom/vitest'` が存在するか

### 解決策

1. ファイル拡張子を `.browser.test.tsx` に変更
2. vitest.setup.ts で jest-dom をインポート
3. vitest.config.mts で setupFiles を指定

---

## `screen.getByRole()` で複数の要素が見つかる

### エラー

```
getMultipleElementsFoundError: Found multiple elements with role "searchbox"
```

### 原因

ページに同じロールの要素が複数ある場合、`getByRole()` は失敗します。複数のテストが DOM を共有している場合もあります。

### 解決策 1：container.querySelector() を使用

```typescript
// Bad（複数要素でエラー）
it('検索フィールドをテストする', () => {
  render(<Component />)
  const input = screen.getByRole('searchbox') // 複数ある場合失敗
})

// Good（セレクタで明確に指定）
it('検索フィールドをテストする', () => {
  const { container } = render(<Component />)
  const input = container.querySelector('input[type="search"]')
  expect(input).toBeTruthy()
})
```

### 解決策 2：afterEach で cleanup を呼び出す

```typescript
import { cleanup } from '@testing-library/react'

describe('Component', () => {
  afterEach(() => {
    cleanup() // 各テスト後に DOM をクリア
  })

  it('テスト1', () => {
    render(<Component />)
  })

  it('テスト2', () => {
    render(<Component />)
  })
})
```

---

## テストがタイムアウト

### エラー

```
Timeout of 10000 ms exceeded
```

### 原因

- 非同期テストで `await` がない
- `vi.useFakeTimers()` を使用している場合に `vi.runAllTimers()` がない
- 無限ループがある
- 重い処理がある

### 解決策 1：非同期テストに await を追加

```typescript
// Bad
it('データを取得する', () => {
  fetchData() // await がない
})

// Good
it('データを取得する', async () => {
  await fetchData()
})
```

### 解決策 2：vi.waitFor() を使用

```typescript
it('ローディングが完了する', async () => {
  render(<DataFetcher />)

  // ローディング完了を待つ
  await vi.waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### 解決策 3：タイムアウト時間を延長

```typescript
it('重い処理のテスト', async () => {
  // タイムアウト時間を 20 秒に延長
  const data = await fetchHeavyData()
  expect(data).toBeTruthy()
}, 20000) // ここでミリ秒を指定
```

---

## `act()` 警告が出ている

### エラー

```
Not wrapped in act(...): ...
Warning: An update to [Component] inside a test was not wrapped in act(...).
```

### 原因

state 更新などの副作用が `act()` でラップされていない。

### 解決策 1：userEvent を使用

```typescript
// Good: userEvent は自動的に act でラップされる
const user = userEvent.setup()
await user.click(button!)
```

### 解決策 2：vi.waitFor() を使用

```typescript
// Good: 非同期更新を待つ
await vi.waitFor(() => {
  expect(container.querySelector('.loaded')).toBeInTheDocument()
})
```

### 解決策 3：act() でラップ

```typescript
import { act } from '@testing-library/react'

it('state が更新される', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

---

## コンポーネントがレンダリングされない

### エラー

```
Expected element, but received: null
```

### 原因

- コンポーネントが条件付きレンダリングされている
- props が正しく渡されていない
- 依存している context が設定されていない

### 解決策 1：selector を確認

```typescript
// セレクタが正しいか確認
const button = container.querySelector('button') // null が返る場合もある

// より詳細なセレクタを使用
const button = container.querySelector('button[type="submit"]')
```

### 解決策 2：props を確認

```typescript
// Good: 必要な props をすべて渡す
const { container } = render(<Button variant="primary" disabled>Click</Button>)
```

### 解決策 3：Context Provider でラップ

```typescript
import { ThemeProvider } from 'context/theme'

it('テーマコンポーネントが表示される', () => {
  const { container } = render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  )
  expect(container.querySelector('button')).toBeInTheDocument()
})
```

---

## モックが効いていない

### エラー

```
TypeError: Cannot read property 'map' of undefined
```

### 原因

モジュールモックが正しく設定されていない。

### 解決策 1：モックの位置を確認

```typescript
// Good: imports の前にモック化
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}))

import { fetchUser } from './api'
```

### 解決策 2：vi.mocked() で型を指定

```typescript
// Good: 型付きで参照
const mockFetch = vi.mocked(fetch)
mockFetch.mockReturnValue(...)

// Bad: 型が不確定
vi.mock('./api')
```

### 解決策 3：beforeEach でリセット

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

---

## "React is not defined" エラー

### エラー

```
ReferenceError: React is not defined
```

### 原因

JSX を使用しているが React をインポートしていない。

### 解決策

```typescript
// Good: React をインポート
import { render } from '@testing-library/react'
import React from 'react'
import { Component } from './Component'

describe('Component', () => {
  it('renders', () => {
    render(<Component />)
  })
})
```

Note: 最新の Next.js では自動的に React がインポートされるので、`import React` は不要の場合があります。

---

## Import エラー（CircularDependency など）

### エラー

```
Error: Cannot find module './Component'
```

### 原因

- パスが間違っている
- ファイルの拡張子が間違っている

### 解決策

```typescript
// Good: 正しいパスを指定
import { Component } from '../Component' // 1つ上のディレクトリ

// Bad: パスが間違っている可能性
import { Component } from './Component' // 同じディレクトリなら '../' は不要
```

---

## テストが遅い

### 原因

- 不要なモックがある
- API 呼び出しが実際に発生している
- 大量のテストを並列実行していない

### 解決策 1：不要なモックを削除

```typescript
// 必要な依存のみモック化
vi.mock('./api', () => ({
  fetchUser: vi.fn(), // 使用するもののみ
}))
```

### 解決策 2：test.concurrent で並列実行

```typescript
it.concurrent('テスト1', () => {
  // 並列実行
})

it.concurrent('テスト2', () => {
  // 並列実行
})
```

### 解決策 3：test.skip で不要なテストをスキップ

```typescript
it.skip('まだ未実装のテスト', () => {
  // スキップされる
})
```

---

## ブラウザテストが Chrome で失敗

### エラー

```
browserType.launch: Chromium crash
```

### 原因

- Playwright がインストールされていない
- Chromium が破損している

### 解決策

```bash
# Playwright ブラウザを再インストール
pnpm exec playwright install chromium

# または全ブラウザをインストール
pnpm exec playwright install
```

---

## チェックリスト：デバッグ時の確認項目

| 項目                  | 確認                                           |
| --------------------- | ---------------------------------------------- |
| テストファイルの配置  | `__tests__/` ディレクトリにあるか              |
| ファイル拡張子        | `.unit.test.ts` または `.browser.test.tsx` か  |
| jest-dom セットアップ | `vitest.setup.ts` で import されているか       |
| cleanup()             | `afterEach` で呼ばれているか（ブラウザテスト） |
| モックリセット        | `beforeEach` で `vi.clearAllMocks()` か        |
| await キーワード      | 非同期テストで `await` があるか                |
| Props 指定            | render() に正しい props が渡されているか       |
| Context               | 必要な Provider でラップされているか           |
| Import パス           | 相対パスが正しいか                             |
