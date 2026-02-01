import { cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MermaidClient from '../mermaid-client';

// Mock next-themes
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  systemTheme: 'light',
}));

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock renderers
const mockRenderWithBeautifulMermaid = vi.fn();
const mockRenderWithIframe = vi.fn();

vi.mock('../mermaid-renderer', () => ({
  renderWithBeautifulMermaid: (...args: unknown[]) => mockRenderWithBeautifulMermaid(...args),
}));

vi.mock('../mermaid-iframe-renderer', () => ({
  renderWithIframe: (...args: unknown[]) => mockRenderWithIframe(...args),
}));

// Mock CodeBlock components
vi.mock('../../code-block/code-block-header', () => ({
  default: ({ code, actions }: { code: string; actions: React.ReactNode }) => (
    <div data-testid="code-block-header">
      <span data-testid="code">{code}</span>
      {actions}
    </div>
  ),
}));

vi.mock('../../code-block/code-block-icon', () => ({
  default: ({ language }: { language: string }) => <span data-testid="code-block-icon">{language}</span>,
}));

describe('MermaidClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      systemTheme: 'light',
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('initial rendering', () => {
    it('shows code view with highlighted HTML during loading', () => {
      mockRenderWithBeautifulMermaid.mockImplementation(() => new Promise(() => {}));
      const highlightedHtml = '<pre class="shiki"><code><span>graph TD;</span></code></pre>';

      const { container } = render(<MermaidClient code="graph TD; A-->B;" highlightedHtml={highlightedHtml} />);

      expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();
      expect(container.querySelector('.is-loading')).toBeInTheDocument();
      expect(container.querySelector('.shiki')).toBeInTheDocument();
    });

    it('shows fallback code during loading when no highlighted HTML', () => {
      mockRenderWithBeautifulMermaid.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();
      expect(container.querySelector('.is-loading')).toBeInTheDocument();
      expect(container.querySelector('pre code')?.textContent).toBe('graph TD; A-->B;');
    });

    it('disables diagram toggle button during loading', () => {
      mockRenderWithBeautifulMermaid.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn).toBeDisabled();
    });
  });

  describe('successful rendering with beautiful-mermaid', () => {
    it('renders SVG when beautiful-mermaid succeeds', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"><text>Diagram</text></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram')).toBeInTheDocument();
      });

      const diagramDiv = container.querySelector('.mermaid-diagram');
      expect(diagramDiv?.innerHTML).toContain('<svg');
    });

    it('shows diagram view by default', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram-view')).toBeInTheDocument();
      });
    });

    it('renders Code toggle button in diagram view', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-toggle-btn')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn?.textContent).toBe('Code');
    });
  });

  describe('fallback to iframe renderer', () => {
    it('uses iframe fallback when beautiful-mermaid returns null', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue(null);
      mockRenderWithIframe.mockResolvedValue({
        success: true,
        svg: '<svg width="200" height="200"><text>Fallback</text></svg>',
      });

      const { container } = render(<MermaidClient code="gantt; task1: 2024-01-01, 7d;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram')).toBeInTheDocument();
      });

      expect(mockRenderWithIframe).toHaveBeenCalled();
      const diagramDiv = container.querySelector('.mermaid-diagram');
      expect(diagramDiv?.innerHTML).toContain('Fallback');
    });

    it('uses iframe fallback when beautiful-mermaid throws error', async () => {
      mockRenderWithBeautifulMermaid.mockRejectedValue(new Error('Parse error'));
      mockRenderWithIframe.mockResolvedValue({
        success: true,
        svg: '<svg width="200" height="200"></svg>',
      });

      const { container } = render(<MermaidClient code="invalid mermaid" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram')).toBeInTheDocument();
      });

      expect(mockRenderWithIframe).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error state when both renderers fail', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue(null);
      mockRenderWithIframe.mockResolvedValue({
        success: false,
        error: 'Syntax error at line 1',
      });

      const { container } = render(<MermaidClient code="completely invalid" />);

      await waitFor(() => {
        expect(container.querySelector('.has-error')).toBeInTheDocument();
      });

      expect(container.querySelector('.mermaid-error-message')).toBeInTheDocument();
      expect(container.textContent).toContain('Syntax Error');
      expect(container.textContent).toContain('Syntax error at line 1');
    });

    it('shows code view when error occurs', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue(null);
      mockRenderWithIframe.mockResolvedValue({
        success: false,
        error: 'Parse error',
      });

      const { container } = render(<MermaidClient code="invalid code" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();
      });

      expect(container.querySelector('pre code')?.textContent).toBe('invalid code');
    });

    it('disables diagram toggle button when error occurs', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue(null);
      mockRenderWithIframe.mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const { container } = render(<MermaidClient code="error" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-toggle-btn')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn).toBeDisabled();
    });
  });

  describe('view mode toggle', () => {
    it('toggles from diagram view to code view', async () => {
      const user = userEvent.setup();
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram-view')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      await user.click(toggleBtn!);

      expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();
      expect(container.querySelector('pre code')?.textContent).toBe('graph TD; A-->B;');
    });

    it('toggles from code view back to diagram view', async () => {
      const user = userEvent.setup();
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram-view')).toBeInTheDocument();
      });

      // Toggle to code view
      const diagramToggleBtn = container.querySelector('.mermaid-toggle-btn');
      await user.click(diagramToggleBtn!);
      expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();

      // Toggle back to diagram view
      const codeToggleBtn = container.querySelector('.mermaid-toggle-btn');
      await user.click(codeToggleBtn!);
      expect(container.querySelector('.mermaid-diagram-view')).toBeInTheDocument();
    });

    it('shows highlighted HTML when provided', async () => {
      const user = userEvent.setup();
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');
      const highlightedHtml = '<pre class="shiki"><code><span>graph TD; A--&gt;B;</span></code></pre>';

      const { container } = render(<MermaidClient code="graph TD; A-->B;" highlightedHtml={highlightedHtml} />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-diagram-view')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      await user.click(toggleBtn!);

      expect(container.querySelector('.mermaid-code-view')).toBeInTheDocument();
      expect(container.querySelector('.shiki')).toBeInTheDocument();
    });
  });

  describe('theme handling', () => {
    it('passes dark theme to renderer when theme is dark', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        systemTheme: 'dark',
      });
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(mockRenderWithBeautifulMermaid).toHaveBeenCalledWith('graph TD; A-->B;', true);
      });
    });

    it('passes light theme to renderer when theme is light', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        systemTheme: 'light',
      });
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(mockRenderWithBeautifulMermaid).toHaveBeenCalledWith('graph TD; A-->B;', false);
      });
    });

    it('uses systemTheme when theme is system', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        systemTheme: 'dark',
      });
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(mockRenderWithBeautifulMermaid).toHaveBeenCalledWith('graph TD; A-->B;', true);
      });
    });
  });

  describe('accessibility', () => {
    it('has aria-label on toggle button in diagram view', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-toggle-btn')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn).toHaveAttribute('aria-label', 'Show code');
    });

    it('has title attribute on toggle buttons', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-toggle-btn')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn).toHaveAttribute('title', 'Show code');
    });

    it('has type="button" on toggle buttons', async () => {
      mockRenderWithBeautifulMermaid.mockResolvedValue('<svg width="100" height="100"></svg>');

      const { container } = render(<MermaidClient code="graph TD; A-->B;" />);

      await waitFor(() => {
        expect(container.querySelector('.mermaid-toggle-btn')).toBeInTheDocument();
      });

      const toggleBtn = container.querySelector('.mermaid-toggle-btn');
      expect(toggleBtn).toHaveAttribute('type', 'button');
    });
  });
});
