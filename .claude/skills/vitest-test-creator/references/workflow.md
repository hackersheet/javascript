# テスト実行ワークフロー

開発中に特定のテストファイルを実行しながら修正する標準的なワークフロー。

## テスト実行コマンド

### 特定ファイルのテストを実行（推奨：開発中）

```bash
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
```

**特徴：**

- 指定したテストファイルのみを実行
- 1回実行して結果を表示
- 修正後に何度でも再実行可能
- 他のテストに影響されない

**使用場面：**

- 1つのコンポーネント・関数を開発・修正中
- テストを追加しながら動作確認
- 修正内容の確認

### パターンマッチで複数ファイル実行

```bash
# パターンを含むすべてのテストを実行
pnpm test:run bookmark

# ディレクトリ内すべてのテストを実行
pnpm test:run src/components/bookmark/__tests__
```

### 全テスト実行（検証用）

```bash
pnpm test:run
```

**使用場面：**

- PR 作成前の全テスト実行
- CI での自動検証
- ビルド時のテスト確認（`pnpm check` に含まれている）

### カバレッジ付き実行

```bash
pnpm test:coverage
```

**特徴：**

- テスト実行とカバレッジ測定
- `coverage/` ディレクトリにレポート生成

## 標準的な開発フロー

1つのファイルを修正する際の推奨フロー：

### ステップ 1：テストファイルを確認する

```bash
# テストファイルの内容を確認
# src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
```

### ステップ 2：テストを実行して現在の状態を確認

```bash
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
```

失敗しているテストを確認します。

### ステップ 3：実装ファイルを修正

```typescript
// src/components/bookmark/bookmark-filter.tsx
export function BookmarkFilter() {
  return (
    <input
      type="search"
      name="keyword"
      placeholder="キーワードを入力して検索"
      className="text-base"
    />
  )
}
```

### ステップ 4：再度テストを実行して確認

```bash
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
```

テストが成功するまでステップ 3-4 を繰り返します。

## 実践的なワークフロー例

### シナリオ 1：コンポーネント開発

```bash
# 1. テストファイルを作成して実行
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
# → 失敗を確認

# 2. コンポーネントを実装
# src/components/bookmark/bookmark-filter.tsx を編集

# 3. テストを再実行
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
# → 成功を確認

# 4. テストを追加して新しい機能をテスト
# src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx に追加

# 5. テストを再実行
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
# → 新テストが失敗

# 6. コンポーネントに新機能を実装

# 7. テストを再実行
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx
# → すべて成功を確認
```

### シナリオ 2：ユーティリティ関数の修正

```bash
# 1. テストを実行
pnpm test:run src/utils/__tests__/create-date-format.unit.test.ts
# → 失敗を確認

# 2. 関数を修正
# src/utils/create-date-format.ts を編集

# 3. テストを再実行
pnpm test:run src/utils/__tests__/create-date-format.unit.test.ts
# → 結果を確認して必要に応じて修正繰り返す
```

### シナリオ 3：複数ファイルの修正

```bash
# 同じディレクトリの複数テストを実行
pnpm test:run src/components/bookmark/__tests__

# パターンで実行
pnpm test:run bookmark

# すべてのテストが成功したら全体実行
pnpm test:run
```

## テストを実行する際のコマンド短縮

開発中に何度も実行するコマンドを短縮する方法：

```bash
# bashrc や zshrc にエイリアスを追加
alias test-bookmark='pnpm test:run src/components/bookmark/__tests__'
alias test-utils='pnpm test:run src/utils/__tests__'

# 使用時
test-bookmark
test-utils
```

## テスト実行と lint エラー確認

テストファイル作成後は、必ず lint エラーも確認してください。

### テスト実行 + lint 確認の手順

```bash
# 1. テストを実行
pnpm test:run src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx

# 2. lint 確認を実行（ESLint と TypeScript エラー）
pnpm lint src/components/bookmark/__tests__/bookmark-filter.browser.test.tsx

# 3. 型チェック確認（必要に応じて）
pnpm check
```

### テスト作成完了時の確認

- [ ] テストが成功しているか（`pnpm test:run`）
- [ ] lint エラーがないか（`pnpm lint`）
- [ ] 型チェックが通っているか（`pnpm check`）
- [ ] import 順序が正しいか
- [ ] `any` 型を使用していないか
- [ ] 未使用の変数がないか

lint エラーの詳細は [troubleshooting.md](troubleshooting.md#チェックリストデバッグ時の確認項目) を参照してください。
