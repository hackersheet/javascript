---
'@hackersheet/next-document-content-components': patch
---

Fix directory tree parsing for varying space widths after vertical line characters

The `parseTreeOutput` function now correctly handles tree command output with different space counts after vertical line characters (│). Previously, only the standard format with exactly 3 spaces was supported, causing incorrect tree structure rendering when fewer spaces were used.
