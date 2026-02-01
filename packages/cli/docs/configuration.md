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

## config コマンド

`config` コマンドを使用して、CLI からインタラクティブに設定を管理できます。

### コマンド構造

```bash
hscli config <subcommand> [options]
```

### サブコマンド一覧

| サブコマンド              | 説明                         |
| ------------------------- | ---------------------------- |
| `config list`             | 設定一覧を表示               |
| `config get <key>`        | 指定キーの値を取得           |
| `config set <key> <value>`| 設定値を変更                 |
| `config init`             | インタラクティブ設定ウィザード |

### 共通オプション

| オプション     | 説明                                                   |
| -------------- | ------------------------------------------------------ |
| `-g, --global` | ユーザー設定 (`~/.config/hackersheet/cli.config.json`) を対象 |
| `-l, --local`  | プロジェクト設定 (`.hackersheet/cli.config.json`) を対象   |

**デフォルト動作**:
- `set` は `--local`（プロジェクト設定）に書き込み
- `list` / `get` はマージされた設定を表示

### config list

現在の設定を一覧表示します。

```bash
# マージされた設定を表示（デフォルト）
hscli config list

# ユーザー設定のみ表示
hscli config list --global

# プロジェクト設定のみ表示
hscli config list --local

# JSON 形式で出力
hscli config list --json
```

**出力例**:

```
Configuration (merged):

  defaultWorkspace = my-workspace
  newFilenameTemplate = {{yyyy}}-{{mm}}-{{dd}}-{{title}}.md
  docsDirs = docs, guides

Workspaces:
  my-workspace (default)
  other-workspace

Config files:
  User:    ~/.config/hackersheet/cli.config.json
  Project: .hackersheet/cli.config.json
```

### config get

特定の設定値を取得します。

```bash
# 基本的な使い方
hscli config get defaultWorkspace

# ネストされたキー（ドット記法）
hscli config get workspaces.my-workspace.accessKey

# ユーザー設定から取得
hscli config get defaultWorkspace --global

# プロジェクト設定から取得
hscli config get defaultWorkspace --local
```

**出力例**:

```bash
$ hscli config get newFilenameTemplate
{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md

$ hscli config get docsDirs
docs, guides
```

### config set

設定値を変更します。

```bash
# プロジェクト設定に書き込み（デフォルト）
hscli config set defaultWorkspace production

# ユーザー設定に書き込み
hscli config set defaultWorkspace personal --global

# 配列値はカンマ区切りで指定
hscli config set docsDirs "docs, guides, tutorials"

# ネストされたキー
hscli config set workspaces.my-workspace.accessKey sk-xxx
```

**出力例**:

```bash
$ hscli config set defaultWorkspace production
Updated defaultWorkspace in project configuration (.hackersheet/cli.config.json)
```

### config init

インタラクティブなウィザードで設定を初期化します。

```bash
# プロジェクト設定を初期化（デフォルト）
hscli config init

# ユーザー設定を初期化
hscli config init --global
```

ウィザードでは以下の項目を設定できます：

1. ワークスペース slug
2. アクセスキー
3. ファイル名テンプレート
4. ドキュメントディレクトリ

### サポートするキー

| キー                            | 説明                     | 型       | set での入力形式         |
| ------------------------------- | ------------------------ | -------- | ------------------------ |
| `defaultWorkspace`              | デフォルトワークスペース | string   | そのまま                 |
| `newFilenameTemplate`           | ファイル名テンプレート   | string   | そのまま                 |
| `newFileTemplatePath`           | テンプレートファイルパス | string   | そのまま                 |
| `docsDirs`                      | ドキュメントディレクトリ | string[] | カンマ区切り             |
| `workspaces.<slug>.accessKey`   | ワークスペースのアクセスキー | string | そのまま             |

### setup コマンドとの関係

`setup` コマンドは `config init` + ディレクトリ作成を行う統合コマンドです。

```bash
# 以下は同等の動作
hscli setup

# これと同じ（+ .hackersheet/trees ディレクトリ作成）
hscli config init
```

新規プロジェクトのセットアップには `setup` を、既存の設定変更には `config` を使用することを推奨します。
