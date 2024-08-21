import {
  transformerNotationDiff,
  transformerNotationWordHighlight,
  transformerRemoveNotationEscape,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { cache } from 'react';
import { bundledLanguages, bundledThemes, getSingletonHighlighter } from 'shiki';

export async function highlighteCode(code: string, language: string) {
  const highlighter = await getShikiHighlighter();
  const shikiLang = Object.keys(bundledLanguages).find((lang) => lang === language);

  if (shikiLang === undefined && language !== 'text') {
    return null;
  }

  const html = highlighter.codeToHtml(code.trim(), {
    lang: shikiLang || 'text',
    themes: {
      light: 'github-light',
      dark: 'github-dark-dimmed',
    },
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationWordHighlight(),
      transformerRemoveNotationEscape(),
    ],
  });

  return html;
}

const getShikiHighlighter = cache(async () => {
  return getSingletonHighlighter({
    themes: Object.keys(bundledThemes),
    langs: Object.keys(bundledLanguages),
  });
});
