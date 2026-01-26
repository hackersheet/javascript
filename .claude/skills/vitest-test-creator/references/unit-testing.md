# ユニットテスト完全ガイド

## 基本構造

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { targetFunction } from '../target-file'

describe('targetFunction', () => {
  beforeEach(() => {
    // 各テスト前のセットアップ
  })

  afterEach(() => {
    // 各テスト後のクリーンアップ
  })

  it('期待する動作を説明', () => {
    // Arrange（準備）
    const input = 'test'

    // Act（実行）
    const result = targetFunction(input)

    // Assert（検証）
    expect(result).toBe('expected')
  })
})
```

## 命名規則

- `describe`: 対象の関数名/クラス名
- `it`: 「〜する」「〜を返す」「〜をスローする」など動作を記述

```typescript
describe('formatDate', () => {
  it('ISO形式の日付を日本語形式に変換する', () => {})
  it('無効な日付でエラーをスローする', () => {})
})
```

## テストパターン例

### 正常系テスト

```typescript
describe('calculateTotal', () => {
  it('商品の合計金額を計算する', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 200, quantity: 1 },
    ]
    expect(calculateTotal(items)).toBe(400)
  })
})
```

### エッジケーステスト

```typescript
describe('calculateTotal', () => {
  it('空配列で0を返す', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('負の数量でエラーをスローする', () => {
    const items = [{ price: 100, quantity: -1 }]
    expect(() => calculateTotal(items)).toThrow('Invalid quantity')
  })
})
```

### テーブル駆動テスト（複数パターン）

```typescript
const testCases = [
  { input: value1, expected: result1, description: 'パターン1' },
  { input: value2, expected: result2, description: 'パターン2' },
  { input: value3, expected: result3, description: 'パターン3' },
]

testCases.forEach(({ input, expected, description }) => {
  it(`${description}を処理する`, () => {
    expect(targetFunction(input)).toBe(expected)
  })
})
```

### 非同期関数テスト

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

## モックの基本

### 関数モック

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'

// 関数モック
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockImplementation((x) => x * 2)

describe('function', () => {
  beforeEach(() => {
    vi.clearAllMocks() // 呼び出し履歴をクリア
  })
})
```

### モジュールモック

```typescript
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

## ベストプラクティス

### 1. 1テスト1振る舞い

```typescript
// Good: 検証が関連している場合は複数のアサーションでもOK
it('ユーザーデータが正しい形式で返される', () => {
  const result = getUserData()
  expect(result).toHaveProperty('id')
  expect(result).toHaveProperty('name')
  expect(result).toHaveProperty('email')
})

// Bad: 関連のない複数の振る舞いをテスト
it('ユーザーデータと設定情報が取得できる', () => {
  const userData = getUserData()
  const settings = getSettings()
  expect(userData).toBeTruthy()
  expect(settings).toBeTruthy()
})
```

### 2. AAA パターンを守る

```typescript
it('入力値に2を掛ける', () => {
  // Arrange（準備）
  const input = 5

  // Act（実行）
  const result = double(input)

  // Assert（検証）
  expect(result).toBe(10)
})
```

### 3. 実装ではなく振る舞いをテスト

```typescript
// Good: 何をするかをテスト
it('合計金額を計算する', () => {
  expect(calculateTotal([{ price: 100, quantity: 2 }])).toBe(200)
})

// Bad: 内部実装に依存
it('配列をループして価格を足す', () => {
  // 実装変更で失敗する可能性がある
})
```

### 4. テストデータの独立性

各テストは他のテストに依存しない。`beforeEach`で共通データを初期化。

```typescript
describe('UserService', () => {
  let user: User

  beforeEach(() => {
    user = { id: 1, name: 'Taro' }
  })

  it('test1', () => {
    // user を使用
  })
  it('test2', () => {
    // user は独立して初期化
  })
})
```

### 5. エッジケースをカバー

- 空文字列
- null/undefined
- 境界値
- 負の数
- 大きな値

### 6. モックは最小限に

テストに必要な依存のみモック化する。不要なモックは避ける。

```typescript
// Good: 必要なAIのみモック
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}))

// Bad: すべてをモック
vi.mock('./api')
vi.mock('./db')
vi.mock('./logger')
```

## テスト作成チェックリスト

- [ ] テストファイルが正しい場所に配置されているか（`__tests__/` ディレクトリ）
- [ ] ファイル名が `.unit.test.ts` か確認
- [ ] テストが `describe` でグループ化されているか
- [ ] `beforeEach` でセットアップされているか（必要に応じて）
- [ ] AAA パターン（Arrange/Act/Assert）に沿っているか
- [ ] 各テストが独立しているか（順序依存がないか）
- [ ] エッジケースが含まれているか
- [ ] モックが `beforeEach` でリセットされているか
- [ ] テスト名から実装を予測できるか
