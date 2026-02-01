# @hackersheet/react-document-content-styles

## 0.1.0-alpha.15

### Patch Changes

- bbf4e48: Update dependencies
  - **next-document-content-components**: Update shiki packages to 3.22.0, mermaid to 11.12.2, and next (dev) to 16.1.6
  - **next-document-content-kifu**: Update next (dev) to 16.1.6
  - **react-document-content**: Update rehype-github-alerts to 4.2.0 and unist-util-visit to 5.1.0
  - **react-document-content-styles**: Update sass to 1.97.3
  - **core**: Update graphql to 16.12.0
  - **cli**: Update @inquirer/prompts to 8.2.0 and commander to 14.0.3

- 8ca8a01: Improve blog article styling for better readability
  - Refine heading styles: apply border-bottom only to h1, adjust margins for clearer section separation
  - Limit heading link area to text width and hide link icon
  - Add hover effect to heading prefix marks (##, ### etc.)
  - Adjust paragraph and list spacing with improved line-height
  - Add subtle background color and border-radius to blockquote
  - Modernize markdown-alert design with background colors and refined typography

- 9fc0a5b: Mermaid component improvements and code/diagram toggle UI
  - Refactor Mermaid component into separate modules (mermaid.tsx, mermaid-renderer.ts, mermaid-utils.ts)
  - Add diagram/code toggle feature with minimal UI in diagram view
  - Display detailed error messages on syntax errors
  - Use dynamic imports for mermaid libraries to reduce bundle size
  - Add CodeBlockHeader actions prop for custom action buttons
  - Add mermaid icon to CodeBlockIcon
  - Update styles for mermaid-block and code-block-actions
