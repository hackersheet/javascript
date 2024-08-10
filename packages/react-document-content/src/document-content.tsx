import deepmerge from 'deepmerge';
import React, { FC, ReactNode } from 'react';
import Markdown, { ExtraProps, Options } from 'react-markdown';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import {
  AComponentResolver,
  GistComponentResolver,
  HeadingComponentResolver,
  ImgComponentResolver,
  KifuToComponentResolver,
  LinkCardComponentResolver,
  PreComponentResolver,
  XPostComponentResolver,
  YoutubeComponentResolver,
} from './component-resolvers';
import { Gist, Link, Heading, Image, CodeBlock, KifuTo, LinkCard, XPost, Youtube } from './components';
import { processInternalLinks, rehypeClobberUrlDecode, rehypeFootnoteLinks } from './rehype-plugins';

import type {
  CodeBlockComponentProps,
  GistComponentProps,
  HeadingComponentProps,
  ImageComponentProps,
  KifuComponentProps,
  KifuToComponentProps,
  LinkCardComponentProps,
  LinkComponentProps,
  MermaidComponentProps,
  XPostComponentProps,
  YoutubeComponentProps,
} from './component-resolvers';
import type { Document, Tree } from '@hackersheet/core';
import type { Styles } from '@hackersheet/react-document-content-styles/basic';

type DirectiveProps = { children: ReactNode } & ExtraProps;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'kifu-to': DirectiveProps;
      'link-card': DirectiveProps;
      'x-post': DirectiveProps;
      youtube: DirectiveProps;
      gist: DirectiveProps;
    }
  }
}

type CssModule = {
  readonly [key: string]: string;
};

export interface DocumentContentProps {
  document: Document;
  tree?: Tree;
  permaLinkFormat?: string;
  style?: Styles | CssModule;
  components?: {
    codeBlock?: FC<CodeBlockComponentProps>;
    gist?: FC<GistComponentProps>;
    heading?: FC<HeadingComponentProps>;
    image?: FC<ImageComponentProps>;
    kifu?: FC<KifuComponentProps>;
    kifuTo?: FC<KifuToComponentProps>;
    link?: FC<LinkComponentProps>;
    linkCard?: FC<LinkCardComponentProps>;
    mermaid?: FC<MermaidComponentProps>;
    xPost?: FC<XPostComponentProps>;
    youtube?: FC<YoutubeComponentProps>;
  };
}

export function DocumentContent({ document, tree, permaLinkFormat, style, components }: DocumentContentProps) {
  const sanitizeSchema = deepmerge(defaultSchema, {
    attributes: { div: [['className', /^sr-only$/]], gist: [['filename']] },
    tagNames: ['gist', 'link-card', 'x-post', 'youtube', 'kifu-to'],
  });

  const CodeBlockComponent = components?.codeBlock ?? CodeBlock;
  const GistComponent = components?.gist ?? Gist;
  const HeadingComponent = components?.heading ?? Heading;
  const ImageComponent = components?.image ?? Image;
  const KifuComponent = components?.kifu;
  const KifuToComponent = components?.kifuTo ?? KifuTo;
  const LinkCardComponent = components?.linkCard ?? LinkCard;
  const LinkComponent = components?.link ?? Link;
  const MermaidComponent = components?.mermaid;
  const XPostComponent = components?.xPost ?? XPost;
  const YoutubeComponent = components?.youtube ?? Youtube;

  const docTree = tree;

  const options: Options = {
    remarkRehypeOptions: { footnoteLabelTagName: 'div', clobberPrefix: '' },
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkDirectiveRehype],
    rehypePlugins: [
      rehypeRaw,
      [rehypeSanitize, sanitizeSchema],
      rehypeSlug,
      rehypeKatex,
      [processInternalLinks, { document, permaLinkFormat, docTree }],
      rehypeFootnoteLinks,
      rehypeClobberUrlDecode,
      rehypeGithubAlerts,
    ],
    components: {
      'kifu-to': (props) => KifuToComponentResolver({ ...props, document, KifuToComponent }),
      'link-card': (props) => LinkCardComponentResolver({ ...props, document, LinkCardComponent }),
      'x-post': (props) => XPostComponentResolver({ ...props, document, XPostComponent }),
      a: (props) => AComponentResolver({ ...props, document, LinkComponent }),
      gist: (props) => GistComponentResolver({ ...props, document, GistComponent }),
      h1: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      h2: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      h3: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      h4: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      h5: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      h6: (props) => HeadingComponentResolver({ ...props, document, HeadingComponent }),
      img: (props) => ImgComponentResolver({ ...props, document, ImageComponent }),
      pre: (props) => PreComponentResolver({ ...props, document, CodeBlockComponent, KifuComponent, MermaidComponent }),
      youtube: (props) => YoutubeComponentResolver({ ...props, document, YoutubeComponent }),
    },
  };

  return (
    <Markdown className={style && style.main} {...options}>
      {document.content}
    </Markdown>
  );
}
