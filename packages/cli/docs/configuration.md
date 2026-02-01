# CLI 設定ファイル仕様

## 概要

Hacker Sheet CLI は JSON 形式の設定ファイルを使用します。設定は以下の2箇所から読み込まれ、マージされます：

1. **ユーザー設定**: `~/.config/hackersheet/cli.config.json`（ベース）
2. **プロジェクト設定**: `.hackersheet/cli.config.json`（オーバーライド）

プロジェクト設定がユーザー設定より優先されます（シャローマージ）。

## 設定ファイル形式

```json
{
  "workspaces": {
    "my-workspace": {
      "accessKey": "sk-..."
    },
    "another-workspace": {
      "accessKey": "sk-..."
    }
  },
  "defaultWorkspace": "my-workspace",
  "newFilenameTemplate": "{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md",
  "newFileTemplatePath": "templates/doc.md",
  "docsDirs": ["docs"]
}
```

## フィールド説明

### `workspaces`

**型**: `Record<string, WorkspaceConfig>`
**必須**: いいえ（デフォルト: `{}`）

登録されたワークスペースの一覧。キーはワークスペースの slug、値は `WorkspaceConfig` オブジェクトです。

```typescript
type WorkspaceConfig = {
  accessKey: string; // API アクセスキー
};
```

**例**:

```json
{
  "workspaces": {
    "personal": { "accessKey": "sk-personal-xxx" },
    "company": { "accessKey": "sk-company-yyy" }
  }
}
```

### `defaultWorkspace`

**型**: `string`
**必須**: いいえ

デフォルトで使用するワークスペースの slug。`--workspace` オプションが指定されていない場合に使用されます。

### `newFilenameTemplate`

**型**: `string`
**必須**: いいえ（デフォルト: `""`）

新規ドキュメント作成時のファイル名テンプレート。Mustache 形式で以下の変数が使用可能：

| 変数        | 説明                                             | 例            |
| ----------- | ------------------------------------------------ | ------------- |
| `{{yyyy}}`  | 4桁の年                                          | `2024`        |
| `{{mm}}`    | 2桁の月                                          | `03`          |
| `{{dd}}`    | 2桁の日                                          | `15`          |
| `{{title}}` | ドキュメントタイトル（スペースはハイフンに置換） | `My-Document` |

**例**: `"{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md"` → `2024-03-15-My-Document.md`

### `newFileTemplatePath`

**型**: `string`
**必須**: いいえ

新規ドキュメントの内容テンプレートファイルのパス（プロジェクトルートからの相対パス）。

### `docsDirs`

**型**: `string[]`
**必須**: いいえ（デフォルト: `[]`）

ドキュメントを作成できるディレクトリの一覧。

## ワークスペース解決ロジック

`docs` コマンドなどでワークスペースを使用する際、以下の優先順位で解決されます：

1. **`--workspace` オプション**: CLI で明示的に指定された場合、そのワークスペースを使用
2. **`defaultWorkspace`**: 設定ファイルでデフォルトが指定されている場合、それを使用
3. **単一ワークスペース**: ワークスペースが1つだけ登録されている場合、自動的にそれを選択
4. **エラー**: 上記いずれにも該当しない場合、エラーを表示

### エラーメッセージ

| 状況                                         | エラーメッセージ                                            |
| -------------------------------------------- | ----------------------------------------------------------- |
| 指定されたワークスペースが存在しない         | `Error: Workspace "<slug>" is not configured.`              |
| ワークスペースが1つも登録されていない        | `Error: No workspaces configured.`                          |
| 複数のワークスペースがあるがデフォルト未設定 | `Error: Multiple workspaces configured but no default set.` |

## CLI オプション

### `docs` コマンド

```bash
hscli docs <slug> [options]
```

| オプション               | 説明                         |
| ------------------------ | ---------------------------- |
| `-w, --workspace <slug>` | 使用するワークスペースを指定 |

**例**:

```bash
# デフォルトワークスペースを使用
hscli docs my-document

# 特定のワークスペースを指定
hscli docs my-document --workspace company
hscli docs my-document -w personal
```

## 設定例

### 単一ワークスペース（シンプル）

```json
{
  "workspaces": {
    "my-workspace": {
      "accessKey": "sk-xxx"
    }
  },
  "newFilenameTemplate": "{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md",
  "docsDirs": ["docs"]
}
```

`defaultWorkspace` を省略しても、ワークスペースが1つだけなので自動選択されます。

### 複数ワークスペース

```json
{
  "workspaces": {
    "personal": {
      "accessKey": "sk-personal-xxx"
    },
    "work": {
      "accessKey": "sk-work-yyy"
    },
    "oss": {
      "accessKey": "sk-oss-zzz"
    }
  },
  "defaultWorkspace": "work",
  "newFilenameTemplate": "{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md",
  "docsDirs": ["docs", "guides"]
}
```

### ユーザー設定とプロジェクト設定の分離

**ユーザー設定** (`~/.config/hackersheet/cli.config.json`):

```json
{
  "workspaces": {
    "personal": { "accessKey": "sk-personal-xxx" },
    "work": { "accessKey": "sk-work-yyy" }
  },
  "defaultWorkspace": "personal"
}
```

**プロジェクト設定** (`.hackersheet/cli.config.json`):

```json
{
  "defaultWorkspace": "work",
  "newFilenameTemplate": "{{title}}.md",
  "docsDirs": ["documentation"]
}
```

この場合、プロジェクト内では `work` ワークスペースがデフォルトで使用され、ファイル名テンプレートとドキュメントディレクトリもプロジェクト固有の設定が適用されます。ワークスペースの認証情報はユーザー設定から継承されます。
