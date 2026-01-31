# @hackersheet/next-document-content-components

## 0.1.0-alpha.28

### Patch Changes

- 452f0e1: Update Mermaid component to use beautiful-mermaid library
  - Add beautiful-mermaid for rendering cleaner Mermaid diagrams
  - Support automatic dark/light theme switching (github-dark / github-light)
  - Fallback to original mermaid library for unsupported diagram types
  - Set transparent background
  - Move next-themes to peerDependencies for proper context sharing

## 0.1.0-alpha.27

### Patch Changes

- Fix directory tree parsing for varying space widths after vertical line characters

  The `parseTreeOutput` function now correctly handles tree command output with different space counts after vertical line characters (│). Previously, only the standard format with exactly 3 spaces was supported, causing incorrect tree structure rendering when fewer spaces were used.

## 0.1.0-alpha.26

### Patch Changes

- Updated dependencies
  - @hackersheet/core@0.1.0-alpha.12
  - @hackersheet/react-document-content@0.1.0-alpha.14
