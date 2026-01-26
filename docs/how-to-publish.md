# npm 公開手順（暫定）

## npm login

```bash
npm logout
npm login
npm whoami # ログイン状態を確認
```

npmにログインする。久しぶりに作業する場合は一度ログアウトしておく。

## 公開

```bash
pnpm core pub
pnpm next-document-content-components pub
pnpm next-document-content-kifu pub
pnpm react-document-content pub
pnpm react-document-content-styles pub
```

パッケージ毎の公開コマンドを実行
