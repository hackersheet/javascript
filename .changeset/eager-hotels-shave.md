---
'@hackersheet/next-document-content-components': patch
---

Update Mermaid component to use beautiful-mermaid library

- Add beautiful-mermaid for rendering cleaner Mermaid diagrams
- Support automatic dark/light theme switching (github-dark / github-light)
- Fallback to original mermaid library for unsupported diagram types
- Set transparent background
- Move next-themes to peerDependencies for proper context sharing
