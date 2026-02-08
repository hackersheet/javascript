# @hackersheet/core

## 0.1.0-alpha.14

### Patch Changes

- 170171e: Fix cursor-based pagination in docs list and completion commands.

  Previously, the CLI was using document IDs as cursor values instead of the proper pagination cursors from the API. The GraphQL query was missing the `pageInfo` field, which contains the correct `endCursor` needed for pagination.

  Changes:
  - Add `pageInfo` field to GraphQL query for documents
  - Include `pageInfo` in `makeGetDocumentsResponse` return value
  - Use `pageInfo.endCursor` instead of `lastDoc.id` for pagination cursor in docs list and completion handler
  - Check `hasNextPage` flag to properly determine when pagination is complete

## 0.1.0-alpha.13

### Patch Changes

- bbf4e48: Update dependencies
  - **next-document-content-components**: Update shiki packages to 3.22.0, mermaid to 11.12.2, and next (dev) to 16.1.6
  - **next-document-content-kifu**: Update next (dev) to 16.1.6
  - **react-document-content**: Update rehype-github-alerts to 4.2.0 and unist-util-visit to 5.1.0
  - **react-document-content-styles**: Update sass to 1.97.3
  - **core**: Update graphql to 16.12.0
  - **cli**: Update @inquirer/prompts to 8.2.0 and commander to 14.0.3

## 0.1.0-alpha.12

### Patch Changes

- Update core
