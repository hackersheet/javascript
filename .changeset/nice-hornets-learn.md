---
'@hackersheet/next-document-content-components': patch
---

Improve mermaid component reliability and compatibility

- Replace `crypto.createHash` with React's `useId()` hook to remove server-side crypto dependency
- Add SVG dimension validation to detect when beautiful-mermaid returns invalid output for unsupported diagrams
- Add `withSafeJsonStringify` helper to handle circular reference errors in block-beta and similar diagrams
- Fix mermaid theme initialization to use correct theme values (`dark`/`default` instead of `dark`/`light`)
- Remove unnecessary ref and simplify rendering logic
