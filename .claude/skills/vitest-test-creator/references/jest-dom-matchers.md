# jest-dom マッチャー完全ガイド

## セットアップ

このプロジェクトでは `@testing-library/jest-dom/vitest` がセットアップされています。

### 必要な設定

1. **vitest.setup.ts** - jest-dom マッチャーを初期化

```typescript
import '@testing-library/jest-dom/vitest'
```

2. **vitest.config.mts** - ブラウザテストプロジェクトで setupFiles を指定

```typescript
defineProject({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // ... 他の設定
  },
})
```

これでブラウザテスト（`.browser.test.tsx`）で jest-dom マッチャーが使用できます。

## マッチャー一覧

### DOM 要素の存在確認（推奨）

```typescript
expect(element).toBeInTheDocument() // 要素が DOM に存在
expect(element).not.toBeInTheDocument() // 要素が DOM に存在しない
```

### 属性チェック

```typescript
expect(element).toHaveAttribute('name', 'keyword')
expect(element).toHaveAttribute('href', '/')
expect(element).toHaveAttribute('aria-label', expect.stringContaining('search'))
```

### クラス名チェック（推奨）

```typescript
expect(element).toHaveClass('text-base')
expect(element).toHaveClass('flex', 'items-center') // 複数クラス
```

### 表示・可視性

```typescript
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toBeChecked()
expect(element).toBeRequired()
expect(element).toBeEmptyDOMElement()
```

### テキスト内容

```typescript
expect(element).toHaveTextContent('Search')
expect(element).toHaveTextContent(expect.stringContaining('keyword'))
```

### フォーム関連

```typescript
expect(input).toHaveValue('entered text')
expect(input).toHaveDisplayValue(['Option 1'])
expect(select).toHaveLength(3) // select の option 数
```

### スタイル

```typescript
expect(element).toHaveStyle('color: red')
expect(element).toHaveStyle({ color: 'red' })
```

## 推奨パターン

### ✅ Good: jest-dom マッチャーを活用

```typescript
it('入力フィールドの属性が正しく設定されている', () => {
  const { container } = render(<BookmarkFilter />)
  const input = container.querySelector('input[type="search"]')

  expect(input).toBeInTheDocument()
  expect(input).toHaveAttribute('name', 'keyword')
  expect(input).toHaveAttribute('placeholder', 'キーワードを入力して検索')
  expect(input).toHaveClass('text-base')
})
```

### ❌ Bad: 標準マッチャーのみで冗長

```typescript
it('入力フィールドの属性が正しく設定されている', () => {
  const { container } = render(<BookmarkFilter />)
  const input = container.querySelector('input[type="search"]') as HTMLInputElement

  expect(input).toBeTruthy()
  expect(input.getAttribute('name')).toBe('keyword')
  expect(input.getAttribute('placeholder')).toBe('キーワードを入力して検索')
  expect(input.className).toContain('text-base')
})
```

## よくあるテストパターン

### ボタン表示テスト

```typescript
it('ボタンが表示される', () => {
  const { container } = render(<Component />)
  const button = container.querySelector('button')
  expect(button).toBeInTheDocument()
  expect(button).toHaveTextContent('クリック')
})
```

### disabled 状態テスト

```typescript
it('disabled 時はボタンが無効', () => {
  const { container } = render(<Button disabled />)
  expect(container.querySelector('button')).toBeDisabled()
})
```

### クラス適用テスト

```typescript
it('primary クラスが適用される', () => {
  const { container } = render(<Button variant="primary" />)
  expect(container.querySelector('button')).toHaveClass('bg-blue-500')
})
```

### フォーム入力テスト

```typescript
it('入力値が設定される', () => {
  const { container } = render(<TextInput defaultValue="test" />)
  const input = container.querySelector('input') as HTMLInputElement
  expect(input).toHaveValue('test')
})
```

### 複数要素テスト

```typescript
it('3つのアイテムが表示される', () => {
  const { container } = render(<ItemList items={[1, 2, 3]} />)
  const items = container.querySelectorAll('li')
  expect(items).toHaveLength(3)
})
```

## マッチャーの選択ガイド

| 確認項目                 | 推奨マッチャー        | 補足                      |
| ------------------------ | --------------------- | ------------------------- |
| 要素が存在するか         | `toBeInTheDocument()` | 最も一般的                |
| テキストが含まれるか     | `toHaveTextContent()` | 部分一致                  |
| 属性値が正しいか         | `toHaveAttribute()`   | 属性確認                  |
| クラスが適用されているか | `toHaveClass()`       | Tailwind CSS 確認時に便利 |
| disabled か              | `toBeDisabled()`      | フォーム確認              |
| 表示されているか         | `toBeVisible()`       | display: none などの確認  |
| チェック状態か           | `toBeChecked()`       | checkbox/radio            |

## ベストプラクティス

### 1. jest-dom マッチャーを優先的に使用

jest-dom マッチャーはテストの意図を明確にし、エラーメッセージも詳細です。

### 2. 標準マッチャーと組み合わせ

```typescript
// jest-dom で存在確認、標準で値確認
const button = container.querySelector('button')
expect(button).toBeInTheDocument()
expect(button?.textContent).toMatch(/クリック/i)
```

### 3. 複数確認は1テストで

```typescript
it('入力フィールドが正しく設定されている', () => {
  const input = container.querySelector('input[type="search"]')
  expect(input).toBeInTheDocument()
  expect(input).toHaveAttribute('name', 'q')
  expect(input).toHaveClass('w-full')
  // 複数の関連確認は1テストでもOK
})
```
