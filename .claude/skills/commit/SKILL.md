---
name: commit
description: プロジェクトのコミットメッセージルールに従ってコミットを作成します。Conventional Commits 形式を使用し、ステージされた変更を分析して適切なメッセージを自動生成します。ユーザーが「コミットして」「変更をコミット」「ステージしたファイルをコミット」などと言った場合や、git の変更をコミットする必要がある状況で使用してください。
---

# コミット作成スキル

## 実行フロー

1. `git status` で変更ファイルを確認
2. `git diff --staged` でステージされた変更を確認（ステージされていない場合は `git diff`）
3. `git log --oneline -5` で最近のコミットスタイルを確認
4. [commit-rules.md](references/commit-rules.md) を読み、ルールに従ってコミットメッセージを作成
5. 必要に応じて `git add` で追加のファイルをステージ
6. `git commit` でコミットを実行
7. `git status` で成功を確認

## 注意事項

- **Co-Authored-By は付けない**
- **本文は原則必須** - 省略条件は [commit-rules.md](references/commit-rules.md) を参照
- **スコープは一つに** - 複数のスコープが必要な場合はコミットを分ける
