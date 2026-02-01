---
'@hackersheet/next-document-content-components': patch
'@hackersheet/react-document-content-styles': patch
---

Add pan/zoom and resize functionality to Mermaid diagrams

- Add `usePanZoom` hook for zoom (mouse wheel with Ctrl/Cmd) and pan (drag when zoomed) support
- Add zoom control buttons (+/-/reset) that appear on hover
- Add resizable container with CSS resize handle
- Diagrams now fit to container size when resized
