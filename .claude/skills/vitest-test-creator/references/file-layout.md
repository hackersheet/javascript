# テストファイル配置・命名規則

## ファイル配置

テストファイルは対象ファイルと同じ階層に`__tests__`ディレクトリを作成して配置します。

### パターン1: コンポーネント1つ = 独立したフォルダ

```text
src/
├── utils/
│   ├── __tests__/
│   │   └── create-date-format.unit.test.ts   # ユニットテスト
│   └── create-date-format.ts
├── lib/
│   ├── __tests__/
│   │   └── string-to-color.unit.test.ts      # ユニットテスト
│   └── string-to-color.ts
├── components/
│   ├── theme-switcher/
│   │   ├── __tests__/
│   │   │   └── theme-switcher.browser.test.tsx  # ブラウザテスト
│   │   └── theme-switcher.tsx
│   └── Button/
│       ├── __tests__/
│       │   └── Button.browser.test.tsx        # ブラウザテスト
│       └── Button.tsx
└── hooks/
    ├── __tests__/
    │   └── useTheme.browser.test.ts           # ブラウザテスト（hooks）
    └── useTheme.ts
```

### パターン2: 複数のコンポーネント/ファイル = 共通の親フォルダ

```text
src/
├── components/
│   ├── bookmark/
│   │   ├── __tests__/
│   │   │   ├── bookmark-filter.browser.test.tsx
│   │   │   └── bookmark-list.browser.test.tsx
│   │   ├── bookmark-filter.tsx
│   │   ├── bookmark-list.tsx
│   │   └── bookmark-card.tsx
```

関連する複数のコンポーネントが同じフォルダにある場合、親フォルダに`__tests__`を1つ作成し、すべてのテストをそこに配置します。

## テストファイル命名規則

**ファイル名の形式：** `対象ファイル名.{unit|browser}.{test|spec}.{ts|tsx}`

| テストタイプ       | ファイルパターン     | 実行環境              | 対象                                 | 例                                |
| ------------------ | -------------------- | --------------------- | ------------------------------------ | --------------------------------- |
| **ユニットテスト** | `*.unit.test.ts`     | Node.js               | 純粋なロジック関数、ユーティリティ   | `create-date-format.unit.test.ts` |
| **ブラウザテスト** | `*.browser.test.tsx` | Playwright (Chromium) | React コンポーネント、カスタム hooks | `theme-switcher.browser.test.tsx` |

## ユニットテストを使う場合

テスト対象が以下の場合：

- **ディレクトリ：** `utils/`, `lib/`, `constants/` 内のファイル
- **内容：** 純粋な関数、ロジック処理、計算、フォーマット
- **例：**
  - `utils/create-date-format.ts` → `create-date-format.unit.test.ts`
  - `lib/string-to-color.ts` → `string-to-color.unit.test.ts`
  - `utils/get-favicon-url.ts` → `get-favicon-url.unit.test.ts`

## ブラウザテストを使う場合

テスト対象が以下の場合：

- **ディレクトリ：** `components/`, `hooks/` 内のファイル
- **内容：** React コンポーネント、カスタム hooks（DOM 操作を含む）
- **例：**
  - `components/theme-switcher/theme-switcher.tsx` → `components/theme-switcher/__tests__/theme-switcher.browser.test.tsx`
  - `components/Button/Button.tsx` → `components/Button/__tests__/Button.browser.test.tsx`
  - `components/bookmark/bookmark-filter.tsx` → `components/bookmark/__tests__/bookmark-filter.browser.test.tsx`
  - `hooks/useTheme.ts` → `hooks/__tests__/useTheme.browser.test.ts`

## Vitest 設定での自動検出

`vitest.config.mts` の設定により、ファイル名で自動的にテストタイプが判定されます：

```typescript
// ユニットテスト（Node.js環境）
include: ['**/__tests__/**/*.unit.{test,spec}.ts']

// ブラウザテスト（Playwright環境）
include: ['**/__tests__/**/*.browser.{test,spec}.ts{,x}']
```
