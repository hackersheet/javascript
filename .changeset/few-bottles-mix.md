---
'@hackersheet/next-document-content-components': patch
'@hackersheet/react-document-content-styles': patch
---

Add pan/zoom and fullscreen functionality to Mermaid diagrams

- Add `usePanZoom` hook for zoom (mouse wheel with Ctrl/Cmd) and pan (drag when zoomed) support
- Add zoom control buttons (+/-/reset/fullscreen) that appear on hover
- Add fullscreen modal view with pan/zoom support
- Fix diagram not displaying in fullscreen modal
- Improve pan speed for smoother navigation

Refactored components following React best practices:

- Split into smaller single-responsibility components
- Add memoization to prevent unnecessary re-renders
- Extract reusable hooks (`useBodyScrollLock`, `useEscapeKey`)
