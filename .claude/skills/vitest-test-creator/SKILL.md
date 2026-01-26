---
name: vitest-test-creator
description: Vitest を使用したテストコード作成・リファクタリング・デバッグ。ユニットテスト(.unit.test.ts)、Reactコンポーネント・Hooksテスト(.browser.test.tsx)、APIハンドラテストに対応。「テストを書いて」「テストケースを追加して」「テストをリファクタリングして」「テストコードを整理して」「このテストをガイドラインに沿って修正して」などのリクエストで使用。.test.ts/.test.tsx ファイルの作成・編集・改善が必要な場合に活用。
---

# Vitest Test Creator

## 🚀 クイックスタート

### ユニットテスト（純粋な関数）

```typescript
// src/utils/__tests__/sum.unit.test.ts
import { describe, it, expect } from 'vitest';
import { sum } from '../sum';

describe('sum', () => {
  it('2つの数を足す', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

### ブラウザテスト（Reactコンポーネント）

```typescript
// src/components/__tests__/Button.browser.test.tsx
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  afterEach(() => cleanup())

  it('ボタンが表示される', () => {
    const { container } = render(<Button>Click</Button>)
    expect(container.querySelector('button')).toBeInTheDocument()
  })
})
```

---

## テストタイプの選択

| テストタイプ | ファイル名           | 対象                                              | 環境       |
| ------------ | -------------------- | ------------------------------------------------- | ---------- |
| **ユニット** | `*.unit.test.ts`     | 純粋な関数・ロジック（utils/, lib/）              | Node.js    |
| **ブラウザ** | `*.browser.test.tsx` | Reactコンポーネント・Hooks（components/, hooks/） | Playwright |

詳細は [file-layout.md](references/file-layout.md) を参照。

---

## 基本構造

### ユニットテストの基本

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { targetFunction } from '../target';

describe('targetFunction', () => {
  beforeEach(() => {
    // セットアップ
  });

  it('期待する動作を説明する', () => {
    // Arrange（準備）
    const input = 'test';
    // Act（実行）
    const result = targetFunction(input);
    // Assert（検証）
    expect(result).toBe('expected');
  });
});
```

### ブラウザテストの基本

```typescript
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Component } from '../Component'

describe('Component', () => {
  afterEach(() => cleanup())

  it('ボタンクリックで onClick を呼び出す', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(<Component onClick={onClick} />)

    const button = container.querySelector('button')
    await user.click(button!)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

詳細な例とベストプラクティスは [unit-testing.md](references/unit-testing.md) と [browser-testing.md](references/browser-testing.md) を参照。

---

## テスト実行コマンド

| 用途                 | コマンド                                                         |
| -------------------- | ---------------------------------------------------------------- |
| **特定ファイル実行** | `pnpm test:run src/components/__tests__/Button.browser.test.tsx` |
| **パターンマッチ**   | `pnpm test:run bookmark`                                         |
| **全テスト実行**     | `pnpm test:run`                                                  |
| **カバレッジ付き**   | `pnpm test:coverage`                                             |

詳細なワークフロー（Watch モード、複数ファイル実行など）は [workflow.md](references/workflow.md) を参照。

---

## よくあるトラブル（TOP 3）

### ❌ jest-dom マッチャーが見つからない

**エラー:** `Property 'toBeInTheDocument' does not exist`

**解決:**

- テストファイルが `.browser.test.tsx` 拡張子か確認
- `vitest.setup.ts` に `import '@testing-library/jest-dom/vitest'` があるか確認

### ❌ `screen.getByRole()` で複数要素エラー

**エラー:** `Found multiple elements with role "searchbox"`

**解決:** `container.querySelector()` を使用するか、`afterEach(() => cleanup())` を追加

### ❌ テストがタイムアウト

**エラー:** `Timeout of XXXX ms`

**解決:**

- 非同期テストに `await` があるか確認
- `vi.useFakeTimers()` を使用している場合は `vi.runAllTimers()` を追加

すべてのトラブルシューティングは [troubleshooting.md](references/troubleshooting.md) を参照。

---

## アサーション・マッチャー

### 基本的なマッチャー

```typescript
expect(value).toBe(expected); // 厳密等価
expect(value).toEqual(expected); // 深い等価
expect(value).toContain('substring'); // 包含
expect(array).toHaveLength(3); // 配列の長さ
expect(() => fn()).toThrow(); // エラー
await expect(asyncFn()).resolves.toBe(value); // 非同期
```

### jest-dom マッチャー（ブラウザテスト推奨）

```typescript
expect(element).toBeInTheDocument(); // DOM に存在
expect(element).toHaveAttribute('name', 'keyword'); // 属性確認
expect(element).toHaveClass('text-base'); // クラス名確認
expect(element).toBeVisible(); // 表示状態
expect(element).toBeDisabled(); // disabled 確認
```

詳細は [jest-dom-matchers.md](references/jest-dom-matchers.md) を参照。

---

## モック

### 関数モック

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
mockFn.mockImplementation((x) => x * 2);
```

### モジュールモック

```typescript
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}));
```

### next/link のモック（Next.js）

```typescript
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => (
    <a href={href}>{children}</a>
  ),
}))
```

詳細と Next.js hooks モック、テスト後のリセット方法は [mocking.md](references/mocking.md) を参照。

---

## ファイル配置・命名規則

テストファイルは対象と同じ階層の `__tests__/` に配置：

```text
src/
├── utils/
│   ├── __tests__/
│   │   └── create-date-format.unit.test.ts
│   └── create-date-format.ts
├── components/
│   ├── Button/
│   │   ├── __tests__/
│   │   │   └── Button.browser.test.tsx
│   │   └── Button.tsx
```

複数関連ファイルの場合は親フォルダに一つ `__tests__/` を作成。

詳細は [file-layout.md](references/file-layout.md) を参照。

---

## 次のステップ

- **ユニットテスト詳細** → [unit-testing.md](references/unit-testing.md)
- **ブラウザテスト詳細** → [browser-testing.md](references/browser-testing.md)
- **モック完全ガイド** → [mocking.md](references/mocking.md)
- **jest-dom マッチャー** → [jest-dom-matchers.md](references/jest-dom-matchers.md)
- **開発ワークフロー** → [workflow.md](references/workflow.md)
- **トラブルシューティング** → [troubleshooting.md](references/troubleshooting.md)
