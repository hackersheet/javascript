---
'@hackersheet/core': patch
'@hackersheet/cli': patch
---

Fix cursor-based pagination in docs list and completion commands.

Previously, the CLI was using document IDs as cursor values instead of the proper pagination cursors from the API. The GraphQL query was missing the `pageInfo` field, which contains the correct `endCursor` needed for pagination.

Changes:
- Add `pageInfo` field to GraphQL query for documents
- Include `pageInfo` in `makeGetDocumentsResponse` return value
- Use `pageInfo.endCursor` instead of `lastDoc.id` for pagination cursor in docs list and completion handler
- Check `hasNextPage` flag to properly determine when pagination is complete
