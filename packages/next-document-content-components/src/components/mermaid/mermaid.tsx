'use client';

import { createHash } from 'crypto';

import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import type { MermaidComponentProps } from '@hackersheet/react-document-content';

function createId(code: string) {
  const hash = createHash('sha256');
  hash.update(code);
  return 'id-' + hash.digest('hex');
}

export default function Mermaid({ code }: MermaidComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState('');
  const { theme, systemTheme } = useTheme();
  const id = createId(code);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mounted) {
        setMounted(true);
      }
      const currentTheme = theme === 'system' ? systemTheme : theme;
      if (mounted && ref.current) {
        mermaid.initialize({ theme: currentTheme });
        try {
          const result = await mermaid.render(id, code, ref.current);
          setSvg(result.svg);
        } catch {
          setSvg('Mermaid Syntax Error');
        }
      }
    };
    renderMermaid();
  }, [mounted, code, id, theme, systemTheme, setSvg, setMounted]);

  if (!mounted) {
    return (
      <div className="mermaid-block mermaid-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} ref={ref} />;
}
