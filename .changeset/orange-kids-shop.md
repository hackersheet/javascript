---
'@hackersheet/next-document-content-components': patch
---

feat(mermaid): add Shiki syntax highlighting for code view

- Refactor Mermaid component into Server/Client composition pattern
  - `Mermaid`: Server Component that pre-renders syntax highlighting with Shiki
  - `MermaidClient`: Client Component that handles interactive features (diagram rendering, theme switching, view toggle)
- Add `CodeBlockCode` shared component for displaying highlighted code (used by both CodeBlock and Mermaid)
- Show syntax-highlighted code during loading instead of "Loading..." text
- Add `mermaid` language to Shiki's bundled languages
- Export `MermaidClient` and `MermaidClientProps` from mermaid module
