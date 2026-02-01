'use client';

import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { renderWithBeautifulMermaid, renderWithMermaidFallback } from './mermaid-renderer';
import CodeBlockHeader from '../code-block/code-block-header';
import CodeBlockIcon from '../code-block/code-block-icon';

import type { MermaidComponentProps } from '@hackersheet/react-document-content';


/**
 * Render state for the mermaid component.
 */
type RenderState = { status: 'loading' } | { status: 'success'; svg: string } | { status: 'error'; message: string };

/**
 * View mode for the mermaid component.
 */
type ViewMode = 'diagram' | 'code';

/**
 * Hoisted static loading fallback to prevent recreation on each render.
 */
const LoadingFallback = (
  <div className="mermaid-block mermaid-loading">
    <div>Loading...</div>
  </div>
);

/**
 * Mermaid diagram component that renders diagrams using beautiful-mermaid.
 * Falls back to the original mermaid library if beautiful-mermaid fails.
 * Automatically switches between light and dark themes based on the current theme.
 *
 * @remarks
 * - Uses dynamic imports to reduce initial bundle size
 * - Handles hydration mismatch by showing loading state until mounted
 * - Supports toggling between diagram and code view
 * - Diagram view shows only the rendered diagram without borders
 * - Code view shows the source code in a code block style
 */
export default function Mermaid({ code }: MermaidComponentProps) {
  const [mounted, setMounted] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>({ status: 'loading' });
  const [viewMode, setViewMode] = useState<ViewMode>('diagram');
  const { theme, systemTheme } = useTheme();
  const renderCountRef = useRef(0);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderDiagram = useCallback(async () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';

    try {
      const result = await renderWithBeautifulMermaid(code, isDark);
      if (result) {
        setRenderState({ status: 'success', svg: result });
        return;
      }
    } catch {
      // Fall through to mermaid fallback
    }

    const uniqueId = `${id}-${++renderCountRef.current}`;
    const result = await renderWithMermaidFallback(code, isDark, uniqueId);
    if (result.success) {
      setRenderState({ status: 'success', svg: result.svg });
    } else {
      setRenderState({ status: 'error', message: result.error });
    }
  }, [code, id, theme, systemTheme]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    renderDiagram();
  }, [mounted, renderDiagram]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'diagram' ? 'code' : 'diagram'));
  }, []);

  if (!mounted || renderState.status === 'loading') {
    return LoadingFallback;
  }

  const hasError = renderState.status === 'error';
  const showDiagram = viewMode === 'diagram' && !hasError;

  if (showDiagram) {
    return (
      <div className="mermaid-block mermaid-diagram-view">
        <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: renderState.svg }} />
        <button
          type="button"
          onClick={toggleViewMode}
          className="mermaid-toggle-btn"
          title="Show code"
          aria-label="Show code"
        >
          Code
        </button>
      </div>
    );
  }

  const toggleButton = (
    <button
      type="button"
      onClick={toggleViewMode}
      className="mermaid-toggle-btn"
      title="Show diagram"
      disabled={hasError}
    >
      Diagram
    </button>
  );

  return (
    <div className={`code-block mermaid-block mermaid-code-view ${hasError ? 'has-error' : ''}`}>
      <CodeBlockHeader icon={<CodeBlockIcon language="mermaid" />} code={code} actions={toggleButton} />
      <div className="mermaid-code">
        {hasError && (
          <div className="mermaid-error-message">
            <strong>Syntax Error</strong>
            <span>{renderState.message}</span>
          </div>
        )}
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
