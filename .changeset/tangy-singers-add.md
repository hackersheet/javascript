---
'@hackersheet/next-document-content-components': patch
'@hackersheet/react-document-content-styles': patch
---

Mermaid component improvements and code/diagram toggle UI

- Refactor Mermaid component into separate modules (mermaid.tsx, mermaid-renderer.ts, mermaid-utils.ts)
- Add diagram/code toggle feature with minimal UI in diagram view
- Display detailed error messages on syntax errors
- Use dynamic imports for mermaid libraries to reduce bundle size
- Add CodeBlockHeader actions prop for custom action buttons
- Add mermaid icon to CodeBlockIcon
- Update styles for mermaid-block and code-block-actions
