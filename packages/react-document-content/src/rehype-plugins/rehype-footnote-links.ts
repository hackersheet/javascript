import { visit } from 'unist-util-visit';

import type { Element } from 'hast';
import type { Parent } from 'unist';

export interface Options {
  clobberPrefix?: string;
}

export default function rehypeFootnoteLinks(options?: Options) {
  return (tree: Parent) => {
    visit(tree, 'element', (element: Element) => {
      const tagName = element.tagName;
      const href = element.properties.href;
      const clobberPrefix =
        options && typeof options.clobberPrefix === 'string' ? options.clobberPrefix : 'user-content-';

      if (tagName !== 'a') return;
      if (typeof href !== 'string') return;
      if (!(href.startsWith('#fn-') || href.startsWith('#fnref-'))) return;

      element.properties.href = `#${clobberPrefix}` + href.replace('#', '');
    });
  };
}
