'use client';

/**
 * Sandboxed iframe-based mermaid renderer.
 * Isolates mermaid rendering from cross-origin iframes on the page.
 * @module
 */

import type { MermaidRenderResult } from './mermaid-renderer';

/**
 * CDN URL for mermaid library.
 * Using ESM build for modern browser compatibility.
 * Used as fallback when beautiful-mermaid doesn't support the diagram type (e.g., Gantt).
 */
const MERMAID_CDN_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

/**
 * Generate the HTML content for the sandboxed iframe.
 * This HTML includes mermaid library and handles postMessage communication.
 *
 * @returns HTML string for iframe srcdoc
 */
const generateIframeHtml = (): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    #container { display: flex; justify-content: center; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import('${MERMAID_CDN_URL}')
      .then((module) => {
        const mermaid = module.default;
        const counter = { value: 0 };

        window.addEventListener('message', async (event) => {
          const { type, code, isDark, requestId } = event.data;
          if (type !== 'render') return;

          const theme = isDark ? 'dark' : 'default';
          mermaid.initialize({ startOnLoad: false, theme });

          try {
            counter.value += 1;
            const uniqueId = 'mermaid-' + counter.value;
            const { svg } = await mermaid.render(uniqueId, code);
            window.parent.postMessage({ type: 'result', success: true, svg, requestId }, '*');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            window.parent.postMessage({ type: 'result', success: false, error: message, requestId }, '*');
          }
        });

        window.parent.postMessage({ type: 'ready' }, '*');
      });
  </script>
</body>
</html>
`;

/**
 * Message sent to iframe for rendering.
 */
interface RenderMessage {
  readonly type: 'render';
  readonly code: string;
  readonly isDark: boolean;
  readonly requestId: string;
}

/**
 * Message received from iframe with render result.
 */
interface ResultMessage {
  readonly type: 'result';
  readonly requestId: string;
  readonly success: boolean;
  readonly svg?: string;
  readonly error?: string;
}

/**
 * Message received when iframe is ready.
 */
interface ReadyMessage {
  readonly type: 'ready';
}

type IframeMessage = ResultMessage | ReadyMessage;

/**
 * Renderer state container.
 * Using an object instead of separate variables to avoid `let`.
 */
interface RendererState {
  iframe: HTMLIFrameElement | null;
  ready: Promise<void> | null;
  readonly pendingRequests: Map<string, (result: MermaidRenderResult) => void>;
}

/**
 * Singleton renderer state.
 * Reusing a single iframe improves performance.
 */
const state: RendererState = {
  iframe: null,
  ready: null,
  pendingRequests: new Map(),
};

/**
 * Generate a unique request ID.
 *
 * @returns Unique string identifier
 */
const generateRequestId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Handle messages from the sandboxed iframe.
 *
 * @param event - Message event from iframe
 */
const handleIframeMessage = (event: MessageEvent<IframeMessage>): void => {
  const { data } = event;

  if (data.type !== 'result') return;

  const resolver = state.pendingRequests.get(data.requestId);
  if (!resolver) return;

  state.pendingRequests.delete(data.requestId);

  const result: MermaidRenderResult =
    data.success && data.svg
      ? { success: true, svg: data.svg }
      : { success: false, error: data.error ?? 'Unknown error' };

  resolver(result);
};

/**
 * Create and initialize the sandboxed iframe.
 *
 * @returns Promise that resolves when iframe is ready
 */
const createIframe = (): Promise<void> => {
  if (state.ready) {
    return state.ready;
  }

  state.ready = new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1920px;height:1080px;border:0;pointer-events:none;';
    iframe.sandbox.add('allow-scripts', 'allow-same-origin');
    iframe.srcdoc = generateIframeHtml();

    const handleReady = (event: MessageEvent<IframeMessage>): void => {
      if (event.source !== iframe.contentWindow || event.data.type !== 'ready') return;

      window.removeEventListener('message', handleReady);
      window.addEventListener('message', handleIframeMessage);
      resolve();
    };

    window.addEventListener('message', handleReady);
    document.body.appendChild(iframe);
    state.iframe = iframe;
  });

  return state.ready;
};

/**
 * Render mermaid diagram using a sandboxed iframe.
 * This isolates the rendering from any cross-origin content on the page.
 *
 * @param code - Mermaid diagram code
 * @param isDark - Whether to use dark theme
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise resolving to render result
 *
 * @example
 * ```ts
 * const result = await renderWithIframe('graph TD; A-->B;', false);
 * if (result.success) {
 *   console.log(result.svg);
 * }
 * ```
 */
export async function renderWithIframe(code: string, isDark: boolean, timeout = 10000): Promise<MermaidRenderResult> {
  await createIframe();

  const contentWindow = state.iframe?.contentWindow;
  if (!contentWindow) {
    return { success: false, error: 'Failed to create iframe' };
  }

  const requestId = generateRequestId();

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      state.pendingRequests.delete(requestId);
      resolve({ success: false, error: 'Render timeout' });
    }, timeout);

    state.pendingRequests.set(requestId, (result) => {
      clearTimeout(timeoutId);
      resolve(result);
    });

    const message: RenderMessage = { type: 'render', code, isDark, requestId };
    contentWindow.postMessage(message, '*');
  });
}

/**
 * Clean up the iframe instance.
 * Call this when the mermaid component is no longer needed.
 */
export function destroyIframe(): void {
  if (!state.iframe) return;

  window.removeEventListener('message', handleIframeMessage);
  state.iframe.remove();
  state.iframe = null;
  state.ready = null;
  state.pendingRequests.clear();
}
