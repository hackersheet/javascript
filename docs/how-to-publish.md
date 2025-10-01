# npm 公開手順（暫定）

## npm login

```bash
npm logout
npm login
```

npmにログインする。久しぶりに作業する場合は一度ログアウトしておく。

## cd

```bash
cd packages/next-document-content-components
```

公開対象のパッケージに移動

## npm publish

```bash
pnpm publish --access public --tag alpha
```

公開
