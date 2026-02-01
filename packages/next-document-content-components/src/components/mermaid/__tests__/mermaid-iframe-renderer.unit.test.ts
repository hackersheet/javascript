import { describe, it, expect } from 'vitest';

/**
 * Unit tests for mermaid-iframe-renderer module constants and utilities.
 *
 * Note: The main functions (renderWithIframe, destroyIframe) require browser DOM
 * and iframe APIs, so they are tested in browser tests or integration tests.
 * These tests cover the module's exported constants and pure logic.
 */

describe('mermaid-iframe-renderer', () => {
  describe('module exports', () => {
    it('exports renderWithIframe function', async () => {
      const { renderWithIframe } = await import('../mermaid-iframe-renderer');
      expect(typeof renderWithIframe).toBe('function');
    });

    it('exports destroyIframe function', async () => {
      const { destroyIframe } = await import('../mermaid-iframe-renderer');
      expect(typeof destroyIframe).toBe('function');
    });
  });

  describe('CDN URL configuration', () => {
    it('uses mermaid v11 from jsdelivr CDN', async () => {
      // Read the source file to verify the CDN URL pattern
      // This ensures the CDN configuration is correct
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
    });
  });

  describe('iframe HTML generation', () => {
    it('contains required HTML structure in source', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify essential parts of the iframe HTML template
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<div id="container"></div>');
      expect(content).toContain('type="module"');
      expect(content).toContain("window.addEventListener('message'");
      expect(content).toContain('window.parent.postMessage');
    });
  });

  describe('message protocol', () => {
    it('defines render message type in source', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify message types are defined
      expect(content).toContain("type: 'render'");
      expect(content).toContain("type: 'result'");
      expect(content).toContain("type: 'ready'");
    });
  });

  describe('security configuration', () => {
    it('uses sandboxed iframe with allow-scripts and allow-same-origin', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain("iframe.sandbox.add('allow-scripts', 'allow-same-origin')");
    });

    it('positions iframe off-screen', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('position:fixed');
      expect(content).toContain('top:-9999px');
      expect(content).toContain('left:-9999px');
    });
  });

  describe('timeout configuration', () => {
    it('has default timeout of 10000ms', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../mermaid-iframe-renderer.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('timeout = 10000');
    });
  });
});
