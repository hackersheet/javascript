import deepmerge from 'deepmerge';
import React, { FC, ReactNode } from 'react';
import Markdown, { ExtraProps, Options } from 'react-markdown';
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
  ImgComponentResolver,
  KifuToComponentResolver,
  LinkCardComponentResolver,
  PreComponentResolver,
  XPostComponentResolver,
  YoutubeComponentResolver,
} from './component-resolvers';
import { Link, Image, CodeBlock, KifuTo, LinkCard, XPost, Youtube } from './components';
import { processInternalLinks, rehypeClobberUrlDecode, rehypeFootnoteLinks } from './rehype-plugins';

import type {
  CodeBlockComponentProps,
  ImageComponentProps,
  KifuToComponentProps,
  LinkCardComponentProps,
  LinkComponentProps,
  XPostComponentProps,
  YoutubeComponentProps,
} from './component-resolvers';
import type { Styles } from './styles/style.module.scss';
import type { Document } from '@hackersheet/core';

type DirectiveProps = { children: ReactNode } & ExtraProps;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'kifu-to': DirectiveProps;
      'link-card': DirectiveProps;
      'x-post': DirectiveProps;
      youtube: DirectiveProps;
    }
  }
}

type CssModule = {
  readonly [key: string]: string;
};

export interface DocumentContentProps {
  document: Document;
  permaLinkFormat?: string;
  style?: Styles | CssModule;
  components?: {
    codeBlock?: FC<CodeBlockComponentProps>;
    image?: FC<ImageComponentProps>;
    kifuTo?: FC<KifuToComponentProps>;
    link?: FC<LinkComponentProps>;
    linkCard?: FC<LinkCardComponentProps>;
    xPost?: FC<XPostComponentProps>;
    youtube?: FC<YoutubeComponentProps>;
  };
}

export function DocumentContent({ document, permaLinkFormat, style, components }: DocumentContentProps) {
  const sanitizeSchema = deepmerge(defaultSchema, {
    attributes: { div: [['className', /^sr-only$/]] },
    tagNames: ['link-card', 'x-post', 'youtube', 'kifu-to'],
  });

  const CodeBlockComponent = components?.codeBlock ?? CodeBlock;
  const ImageComponent = components?.image ?? Image;
  const KifuToComponent = components?.kifuTo ?? KifuTo;
  const LinkCardComponent = components?.linkCard ?? LinkCard;
  const LinkComponent = components?.link ?? Link;
  const XPostComponent = components?.xPost ?? XPost;
  const YoutubeComponent = components?.youtube ?? Youtube;

  const options: Options = {
    remarkRehypeOptions: { footnoteLabelTagName: 'div', clobberPrefix: '' },
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, remarkDirectiveRehype],
    rehypePlugins: [
      rehypeRaw,
      [rehypeSanitize, sanitizeSchema],
      rehypeSlug,
      rehypeKatex,
      [processInternalLinks, { document, permaLinkFormat }],
      rehypeFootnoteLinks,
      rehypeClobberUrlDecode,
    ],
    components: {
      'kifu-to': (props) => KifuToComponentResolver({ ...props, document, KifuToComponent }),
      'link-card': (props) => LinkCardComponentResolver({ ...props, document, LinkCardComponent }),
      'x-post': (props) => XPostComponentResolver({ ...props, document, XPostComponent }),
      a: (props) => AComponentResolver({ ...props, document, LinkComponent }),
      h1: 'h2',
      img: (props) => ImgComponentResolver({ ...props, document, ImageComponent }),
      pre: (props) => PreComponentResolver({ ...props, document, CodeBlockComponent }),
      youtube: (props) => YoutubeComponentResolver({ ...props, document, YoutubeComponent }),
    },
  };

  return (
    <Markdown className={style && style.main} {...options}>
      {document.content}
    </Markdown>
  );
}
