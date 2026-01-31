---
'@hackersheet/next-document-content-components': patch
---

Fix memory leak by cleaning up temporary DOM elements (`d{id}`) that mermaid.render() creates in document body during fallback rendering
