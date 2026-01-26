/// <reference types="@testing-library/jest-dom" />
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';

import HackersheetDocumentContent from '../document-content';

import type { Document, Tree } from '@hackersheet/core';

interface MockDocumentContentProps {
  document: Document;
  tree?: Tree;
  style: Record<string, unknown>;
  permaLinkFormat: string;
  components: Record<string, unknown>;
}

// すべての依存パッケージをモック
vi.mock('@hackersheet/react-document-content', () => ({
  DocumentContent: ({ document, tree, permaLinkFormat, components }: MockDocumentContentProps) => (
    <div data-testid="document-content">
      <div data-testid="document-id">{document.id}</div>
      {tree && <div data-testid="tree-id">{tree.id}</div>}
      <div data-testid="permalink-format">{permaLinkFormat}</div>
      <div data-testid="components-count">{Object.keys(components).length}</div>
    </div>
  ),
}));

vi.mock('@hackersheet/next-document-content-components', () => ({
  CodeBlock: () => null,
  DirectoryTree: () => null,
  Gist: () => null,
  Heading: () => null,
  Image: () => null,
  Link: () => null,
  LinkCard: () => null,
  Mermaid: () => null,
  XPost: () => null,
  Youtube: () => null,
}));

vi.mock('@hackersheet/next-document-content-kifu', () => ({
  Kifu: () => null,
  KifuTo: () => null,
}));

vi.mock('@hackersheet/react-document-content-styles/basic', () => ({
  default: {},
}));

describe('HackersheetDocumentContent', () => {
  afterEach(() => cleanup());

  it('ドキュメントを描画する', () => {
    const document: Document = {
      id: 'doc-1',
      slug: 'test-document',
      emoji: '📝',
      title: 'Test Document',
      draft: false,
      content: 'Test content',
      publishedAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-01T00:00:00Z',
      tags: [],
      assets: [],
      outboundLinkDocuments: [],
      inboundLinkDocuments: [],
      websites: [],
    };

    const { container } = render(
      <HackersheetDocumentContent document={document} permaLinkFormat="/posts/{{slug}}" />
    );

    expect(container.querySelector('[data-testid="document-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="document-id"]')).toHaveTextContent('doc-1');
  });

  it('permaLinkFormat を DocumentContent に渡す', () => {
    const document: Document = {
      id: 'doc-2',
      slug: 'test-doc',
      emoji: '📝',
      title: 'Test',
      draft: false,
      content: 'Test content',
      publishedAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-01T00:00:00Z',
      tags: [],
      assets: [],
      outboundLinkDocuments: [],
      inboundLinkDocuments: [],
      websites: [],
    };

    const { container } = render(
      <HackersheetDocumentContent document={document} permaLinkFormat="/tree/{{{slug}}}" />
    );

    expect(container.querySelector('[data-testid="permalink-format"]')).toHaveTextContent(
      '/tree/{{{slug}}}'
    );
  });

  it('tree が渡された場合、DocumentContent に渡す', () => {
    const document: Document = {
      id: 'doc-3',
      slug: 'test-doc',
      emoji: '📝',
      title: 'Test',
      draft: false,
      content: 'Test content',
      publishedAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-01T00:00:00Z',
      tags: [],
      assets: [],
      outboundLinkDocuments: [],
      inboundLinkDocuments: [],
      websites: [],
    };

    const tree: Tree = {
      id: 'tree-1',
      slug: 'test-tree',
      name: 'Test Tree',
      nodes: [],
      flatNodes: [],
    };

    const { container } = render(
      <HackersheetDocumentContent document={document} tree={tree} permaLinkFormat="/posts/{{slug}}" />
    );

    expect(container.querySelector('[data-testid="tree-id"]')).toHaveTextContent('tree-1');
  });

  it('tree がない場合、DocumentContent に undefined を渡す', () => {
    const document: Document = {
      id: 'doc-4',
      slug: 'test-doc',
      emoji: '📝',
      title: 'Test',
      draft: false,
      content: 'Test content',
      publishedAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-01T00:00:00Z',
      tags: [],
      assets: [],
      outboundLinkDocuments: [],
      inboundLinkDocuments: [],
      websites: [],
    };

    const { container } = render(
      <HackersheetDocumentContent document={document} permaLinkFormat="/posts/{{slug}}" />
    );

    expect(container.querySelector('[data-testid="tree-id"]')).not.toBeInTheDocument();
  });

  it('すべての必須コンポーネントを DocumentContent に渡す', () => {
    const document: Document = {
      id: 'doc-5',
      slug: 'test-doc',
      emoji: '📝',
      title: 'Test',
      draft: false,
      content: 'Test content',
      publishedAt: '2024-01-01T00:00:00Z',
      modifiedAt: '2024-01-01T00:00:00Z',
      tags: [],
      assets: [],
      outboundLinkDocuments: [],
      inboundLinkDocuments: [],
      websites: [],
    };

    const { container } = render(
      <HackersheetDocumentContent document={document} permaLinkFormat="/posts/{{slug}}" />
    );

    // 12個のコンポーネントが渡されることを確認
    expect(container.querySelector('[data-testid="components-count"]')).toHaveTextContent('12');
  });
});
