import {
  CodeBlock,
  DirectoryTree,
  Gist,
  Heading,
  Image,
  Link,
  LinkCard,
  Mermaid,
  XPost,
  Youtube,
} from '@hackersheet/next-document-content-components';
import { Kifu, KifuTo } from '@hackersheet/next-document-content-kifu';
import { DocumentContent } from '@hackersheet/react-document-content';
import documentContentStyle from '@hackersheet/react-document-content-styles/basic';

import type { Document, Tree } from '@hackersheet/core';

/**
 * Props for HackersheetDocumentContent component
 */
export interface HackersheetDocumentContentProps {
  /**
   * The document to render
   */
  document: Document;
  /**
   * Optional tree structure for hierarchical navigation
   */
  tree?: Tree;
  /**
   * The format string for permanent links
   * Examples: "/posts/{{slug}}", "/tree/{{{slug}}}"
   */
  permaLinkFormat: string;
}

/**
 * Wrapper component for DocumentContent with pre-configured components and styles
 *
 * This component encapsulates the standard Hackersheet document rendering setup,
 * providing a consistent interface across different page types (posts, tree nodes, etc.)
 *
 * @example
 * ```tsx
 * <HackersheetDocumentContent
 *   document={doc}
 *   permaLinkFormat="/posts/{{slug}}"
 * />
 * ```
 *
 * @example
 * ```tsx
 * <HackersheetDocumentContent
 *   document={doc}
 *   tree={tree}
 *   permaLinkFormat="/tree/{{{slug}}}"
 * />
 * ```
 */
export default function HackersheetDocumentContent({
  document,
  tree,
  permaLinkFormat,
}: HackersheetDocumentContentProps) {
  return (
    <DocumentContent
      document={document}
      tree={tree}
      style={documentContentStyle}
      permaLinkFormat={permaLinkFormat}
      components={{
        codeBlock: CodeBlock,
        directoryTree: DirectoryTree,
        gist: Gist,
        heading: Heading,
        image: Image,
        kifu: Kifu,
        kifuTo: KifuTo,
        link: Link,
        linkCard: LinkCard,
        mermaid: Mermaid,
        xPost: XPost,
        youtube: Youtube,
      }}
    />
  );
}
