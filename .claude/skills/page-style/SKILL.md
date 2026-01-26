---
name: page-style
description: page.tsx のコーディングスタイルガイド
---

# page.tsx コーディングスタイルガイド

`src/app` 以下の `page.tsx` ファイルを作成・編集する際のスタイルガイドです。

## ファイル構造

以下の順序で記述してください：

1. import 文
2. 定数（title, description）
3. metadata エクスポート
4. Props 型定義（必要な場合）
5. dynamic / revalidate 設定
6. generateMetadata 関数（動的メタデータの場合）
7. デフォルトエクスポート関数

## import 文

### 順序

1. Next.js のモジュール（`next`, `next/*`）
2. React のモジュール（`react`）
3. 空行
4. 内部モジュール（`@/` から始まるパス）

### 同一モジュールからのインポート

同一モジュールからは1行でまとめてインポートしてください。

```tsx
// Good
import { Container, PageHeader } from '@/components/layout'

// Bad
import { Container } from '@/components/layout'
import { PageHeader } from '@/components/layout'
```

## 定数定義

静的ページでは `title` と `description` を定数として定義してください。

```tsx
const title = 'About'
const description = 'naopoyo.comについて説明しているページです。'
```

## metadata エクスポート

定数を使用して定義してください。

```tsx
export const metadata: Metadata = {
  title: title,
  description: description,
}
```

## Props 型定義

- `export type` を使用してください

```tsx
// Good
export type DocsPageProps = {
  searchParams: Promise<{ keyword?: string }>
}

// Bad
interface DocsPageProps {
  searchParams: Promise<{ keyword?: string }>
}

// Bad
type DocsPageProps = {
  searchParams: Promise<{ keyword?: string }>
}
```

## dynamic / revalidate 設定

基本的にすべてのページで設定してください。

```tsx
export const dynamic = 'force-static'
export const revalidate = 60
```

## 関数名

`XxxPage` 形式で命名してください。ディレクトリ名を PascalCase に変換して `Page` を付けます。

| パス                                   | 関数名            |
| -------------------------------------- | ----------------- |
| `src/app/page.tsx`                     | `HomePage`        |
| `src/app/about/page.tsx`               | `AboutPage`       |
| `src/app/docs/page.tsx`                | `DocsPage`        |
| `src/app/docs/[documentSlug]/page.tsx` | `DocumentPage`    |
| `src/app/tools/random-emoji/page.tsx`  | `RandomEmojiPage` |

## JSX 構造

### Container

すべてのページは `Container` コンポーネントでラップしてください。

```tsx
<Container className="flex flex-col items-center gap-8 pt-16">{/* コンテンツ */}</Container>
```

### PageHeader

ホームページ以外は `PageHeader` コンポーネントを使用してください。

```tsx
<PageHeader title={title} description={description} />
```

## テンプレート

### 静的ページ（シンプル）

```tsx
import { Metadata } from 'next'

import { Container, PageHeader } from '@/components/layout'

const title = 'About'
const description = 'ページの説明文です。'

export const metadata: Metadata = {
  title: title,
  description: description,
}

export const dynamic = 'force-static'
export const revalidate = 60

export default async function AboutPage() {
  return (
    <Container className="flex flex-col items-center gap-8 pt-16">
      <PageHeader title={title} description={description} />
      {/* コンテンツ */}
    </Container>
  )
}
```

### 動的ページ（パラメータあり）

```tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container, PageHeader } from '@/components/layout'
import { client } from '@/lib/hackersheet'

export type TagPageProps = {
  params: Promise<{ tagName: string }>
}

export const dynamic = 'force-static'
export const revalidate = 60

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const params = await props.params
  const { tagName } = params

  // データ取得とメタデータ生成
  return {
    title: `${tagName} - Tags`,
  }
}

export default async function TagPage(props: TagPageProps) {
  const params = await props.params
  const { tagName } = params

  // データ取得
  // if (!data) return notFound()

  return (
    <Container className="flex flex-col items-center gap-8 pt-16">
      <PageHeader title={tagName} />
      {/* コンテンツ */}
    </Container>
  )
}
```

### searchParams を使用するページ

```tsx
import { Metadata } from 'next'
import { Suspense } from 'react'

import { Container, PageHeader } from '@/components/layout'

const title = 'Docs'
const description = 'すべての記事の一覧ページです。'

export const metadata: Metadata = {
  title: title,
  description: description,
}

export type DocsPageProps = {
  searchParams: Promise<{ keyword?: string }>
}

export const dynamic = 'force-static'
export const revalidate = 60

export default async function DocsPage(props: DocsPageProps) {
  const searchParams = await props.searchParams
  const keyword = searchParams.keyword

  return (
    <Container className="flex flex-col items-center gap-8 pt-16">
      <PageHeader title={title} description={description} />
      <Suspense fallback={<div>Loading...</div>}>{/* 非同期コンテンツ */}</Suspense>
    </Container>
  )
}
```
