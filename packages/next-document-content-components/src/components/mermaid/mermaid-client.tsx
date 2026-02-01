'use client';

import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useState } from 'react';

import { MermaidDiagramView } from './mermaid-diagram-view';
import { renderWithIframe } from './mermaid-iframe-renderer';
import { renderWithBeautifulMermaid } from './mermaid-renderer';
import CodeBlockCode from '../code-block/code-block-code';
import CodeBlockHeader from '../code-block/code-block-header';
import CodeBlockIcon from '../code-block/code-block-icon';

/**
 * Props for the MermaidClient component.
 */
export type MermaidClientProps = {
  /** The mermaid diagram code */
  code: string;
  /** Pre-rendered HTML from Shiki highlighter for code view */
  highlightedHtml?: string | null;
};

/**
 * Render state for the mermaid component.
 */
type RenderState = { status: 'loading' } | { status: 'success'; svg: string } | { status: 'error'; message: string };

/**
 * View mode for the mermaid component.
 */
type ViewMode = 'diagram' | 'code';

/**
 * Client component for rendering Mermaid diagrams with interactive features.
 *
 * @remarks
 * This component handles:
 * - Diagram rendering using beautiful-mermaid with iframe fallback
 * - Theme switching (light/dark)
 * - Toggle between diagram and code view
 * - Syntax-highlighted code display during loading
 *
 * Component architecture:
 * - MermaidClient: Main controller for rendering and state management
 * - MermaidDiagramView: Diagram display with pan/zoom (separate file)
 * - MermaidFullscreenModal: Fullscreen view (separate file)
 * - MermaidZoomControls: Reusable zoom buttons (memoized)
 * - MermaidDiagramContent: SVG renderer (memoized)
 *
 * @param props - The component props
 * @param props.code - The mermaid diagram code
 * @param props.highlightedHtml - Pre-rendered HTML from Shiki highlighter
 * @returns The rendered mermaid component
 */
export default function MermaidClient({ code, highlightedHtml }: MermaidClientProps) {
  const [mounted, setMounted] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>({ status: 'loading' });
  const [viewMode, setViewMode] = useState<ViewMode>('diagram');
  const { theme, systemTheme } = useTheme();

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
      // Fall through to iframe fallback
    }

    const result = await renderWithIframe(code, isDark);
    if (result.success) {
      setRenderState({ status: 'success', svg: result.svg });
    } else {
      setRenderState({ status: 'error', message: result.error });
    }
  }, [code, theme, systemTheme]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    renderDiagram();
  }, [mounted, renderDiagram]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'diagram' ? 'code' : 'diagram'));
  }, []);

  const isLoading = !mounted || renderState.status === 'loading';
  const hasError = renderState.status === 'error';
  const showDiagram = viewMode === 'diagram' && !hasError && !isLoading;

  if (showDiagram) {
    return <MermaidDiagramView svg={renderState.svg} onToggleViewMode={toggleViewMode} />;
  }

  return (
    <MermaidCodeView
      code={code}
      highlightedHtml={highlightedHtml}
      hasError={hasError}
      isLoading={isLoading}
      errorMessage={renderState.status === 'error' ? renderState.message : undefined}
      onToggleViewMode={toggleViewMode}
    />
  );
}

/**
 * Props for the MermaidCodeView component.
 */
type MermaidCodeViewProps = {
  /** The mermaid diagram code */
  code: string;
  /** Pre-rendered HTML from Shiki highlighter */
  highlightedHtml?: string | null;
  /** Whether there is an error */
  hasError: boolean;
  /** Whether the diagram is loading */
  isLoading: boolean;
  /** Error message if hasError is true */
  errorMessage?: string;
  /** Callback to toggle view mode */
  onToggleViewMode: () => void;
};

/**
 * Code view for Mermaid diagrams with syntax highlighting.
 *
 * @param props - The component props
 * @returns The code view component
 */
function MermaidCodeView({
  code,
  highlightedHtml,
  hasError,
  isLoading,
  errorMessage,
  onToggleViewMode,
}: MermaidCodeViewProps) {
  const toggleButton = (
    <button
      type="button"
      onClick={onToggleViewMode}
      className="mermaid-toggle-btn"
      title="Show diagram"
      disabled={hasError || isLoading}
    >
      Diagram
    </button>
  );

  return (
    <div
      className={`code-block mermaid-block mermaid-code-view ${hasError ? 'has-error' : ''} ${isLoading ? 'is-loading' : ''}`}
    >
      <CodeBlockHeader icon={<CodeBlockIcon language="mermaid" />} code={code} actions={toggleButton} />
      <div className="mermaid-code">
        {hasError && errorMessage ? (
          <div className="mermaid-error-message">
            <strong>Syntax Error</strong>
            <span>{errorMessage}</span>
          </div>
        ) : null}
        <CodeBlockCode code={code} highlightedHtml={highlightedHtml} />
      </div>
    </div>
  );
}
