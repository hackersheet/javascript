# @hackersheet/next-document-content-components

## 0.1.0-alpha.30

### Patch Changes

- 9084efc: Fix memory leak by cleaning up temporary DOM elements (`d{id}`) that mermaid.render() creates in document body during fallback rendering

## 0.1.0-alpha.29

### Patch Changes

- 627565f: Improve mermaid component reliability and compatibility
  - Replace `crypto.createHash` with React's `useId()` hook to remove server-side crypto dependency
  - Add SVG dimension validation to detect when beautiful-mermaid returns invalid output for unsupported diagrams
  - Add `withSafeJsonStringify` helper to handle circular reference errors in block-beta and similar diagrams
  - Fix mermaid theme initialization to use correct theme values (`dark`/`default` instead of `dark`/`light`)
  - Remove unnecessary ref and simplify rendering logic

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
