import {
  transformerNotationDiff,
  transformerNotationWordHighlight,
  transformerRemoveNotationEscape,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { cache } from 'react';
import { bundledLanguages, getSingletonHighlighterCore } from 'shiki/bundle/web';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export async function highlighteCode(code: string, language: string) {
  const highlighter = await getShikiHighlighter();
  const shikiLangs = highlighter.getLoadedLanguages();
  const shikiLang = shikiLangs.find((lang) => lang === language);

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
  return getSingletonHighlighterCore({
    themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark-dimmed')],
    langs: Object.values(bundledLanguages),
    engine: createJavaScriptRegexEngine(),
  });
});
