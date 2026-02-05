# @hackersheet/next-document-content-components

## 0.1.0-alpha.36

### Patch Changes

- 175d7dd: Add config command for managing CLI configuration
  - Add `config` command with subcommands: `get`, `set`, `list`, `init`, `delete`, `path`
  - Support multi-workspace configuration with fallback and merge functionality
  - Use XDG Base Directory Specification for user config path
  - Add terminal output colorization for better readability

## 0.1.0-alpha.35

### Patch Changes

- @hackersheet/react-document-content@0.1.0-alpha.17

## 0.1.0-alpha.34

### Patch Changes

- bfa925e: Add pan/zoom and fullscreen functionality to Mermaid diagrams
  - Add `usePanZoom` hook for zoom (mouse wheel with Ctrl/Cmd) and pan (drag when zoomed) support
  - Add zoom control buttons (+/-/reset/fullscreen) that appear on hover
  - Add fullscreen modal view with pan/zoom support
  - Fix diagram not displaying in fullscreen modal
  - Improve pan speed for smoother navigation

  Refactored components following React best practices:
  - Split into smaller single-responsibility components
  - Add memoization to prevent unnecessary re-renders
  - Extract reusable hooks (`useBodyScrollLock`, `useEscapeKey`)

- 20df186: feat(mermaid): add Shiki syntax highlighting for code view
  - Refactor Mermaid component into Server/Client composition pattern
    - `Mermaid`: Server Component that pre-renders syntax highlighting with Shiki
    - `MermaidClient`: Client Component that handles interactive features (diagram rendering, theme switching, view toggle)
  - Add `CodeBlockCode` shared component for displaying highlighted code (used by both CodeBlock and Mermaid)
  - Show syntax-highlighted code during loading instead of "Loading..." text
  - Add `mermaid` language to Shiki's bundled languages
  - Export `MermaidClient` and `MermaidClientProps` from mermaid module
  - @hackersheet/react-document-content@0.1.0-alpha.16

## 0.1.0-alpha.33

### Patch Changes

- dd062f6: Fix mermaid rendering errors on pages with cross-origin iframes
  - Add sandboxed iframe-based fallback renderer for diagram types not supported by beautiful-mermaid (e.g., Gantt charts)
  - Load mermaid library from CDN within isolated iframe to avoid cross-origin security errors
  - Refactor mermaid-iframe-renderer to use functional style with state object instead of `let` variables
  - Add comprehensive test coverage (63 tests) for mermaid utilities, component, and iframe renderer

## 0.1.0-alpha.32

### Patch Changes

- b7c7797: Fix cross-origin error in mermaid component when rendering diagrams on pages with cross-origin iframes

## 0.1.0-alpha.31

### Patch Changes

- bbf4e48: Update dependencies
  - **next-document-content-components**: Update shiki packages to 3.22.0, mermaid to 11.12.2, and next (dev) to 16.1.6
  - **next-document-content-kifu**: Update next (dev) to 16.1.6
  - **react-document-content**: Update rehype-github-alerts to 4.2.0 and unist-util-visit to 5.1.0
  - **react-document-content-styles**: Update sass to 1.97.3
  - **core**: Update graphql to 16.12.0
  - **cli**: Update @inquirer/prompts to 8.2.0 and commander to 14.0.3

- 9fc0a5b: Mermaid component improvements and code/diagram toggle UI
  - Refactor Mermaid component into separate modules (mermaid.tsx, mermaid-renderer.ts, mermaid-utils.ts)
  - Add diagram/code toggle feature with minimal UI in diagram view
  - Display detailed error messages on syntax errors
  - Use dynamic imports for mermaid libraries to reduce bundle size
  - Add CodeBlockHeader actions prop for custom action buttons
  - Add mermaid icon to CodeBlockIcon
  - Update styles for mermaid-block and code-block-actions

- Updated dependencies [bbf4e48]
  - @hackersheet/react-document-content@0.1.0-alpha.15
  - @hackersheet/core@0.1.0-alpha.13

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
