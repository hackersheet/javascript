---
'@hackersheet/next-document-content-components': patch
---

Fix mermaid rendering errors on pages with cross-origin iframes

- Add sandboxed iframe-based fallback renderer for diagram types not supported by beautiful-mermaid (e.g., Gantt charts)
- Load mermaid library from CDN within isolated iframe to avoid cross-origin security errors
- Refactor mermaid-iframe-renderer to use functional style with state object instead of `let` variables
- Add comprehensive test coverage (63 tests) for mermaid utilities, component, and iframe renderer
