# @hackersheet/cli

## 0.1.0-alpha.9

### Patch Changes

- 170171e: Fix cursor-based pagination in docs list and completion commands.

  Previously, the CLI was using document IDs as cursor values instead of the proper pagination cursors from the API. The GraphQL query was missing the `pageInfo` field, which contains the correct `endCursor` needed for pagination.

  Changes:
  - Add `pageInfo` field to GraphQL query for documents
  - Include `pageInfo` in `makeGetDocumentsResponse` return value
  - Use `pageInfo.endCursor` instead of `lastDoc.id` for pagination cursor in docs list and completion handler
  - Check `hasNextPage` flag to properly determine when pagination is complete

- Updated dependencies [170171e]
  - @hackersheet/core@0.1.0-alpha.14

## 0.1.0-alpha.8

### Minor Changes

- b700e61: ## Major Features and Improvements

  ### Shell Tab Completion System (Complete Implementation)
  - **Document Slug Completion**: Autocomplete document slugs with `docs show <TAB>`
  - **Document Title Display**: Show document titles in zsh/fish completion suggestions
  - **Workspace Auto-detection**: Support -w/--workspace option, default workspace, and single workspace auto-selection
  - **All Subcommand Completion**: Autocomplete subcommands for docs, config, completion, and cache commands
  - **Cursor-based Pagination**: Display all completion candidates in large document environments (100+)
  - **Metadata Cache**: Cache completion metadata in ~/.cache/hackersheet/slugs-cache.json

  ### Setup/Init Command Separation
  - **`hscli setup`**: Configure global settings (workspace authentication) in ~/.config/hackersheet/cli.config.json
  - **`hscli init`**: Configure project settings (document directories, filename template) in .hackersheet/cli.config.json
  - **Mode-based Wizard**: Conditional prompting with ConfigWizardMode('global', 'project', 'all')
  - **Prerequisite Validation**: Validate setup execution in init/new commands with clear error messages
  - **Git-inspired Pattern**: Design follows Git's --global/--local pattern for familiarity

  ### Docs Command Refactoring
  - **`docs list`**: Display all documents with pagination support
  - **`docs show <slug>`**: Display document content by slug
  - Improved CLI consistency and usability

  ### Document Content Caching
  - **Persistent File-based Cache**: Store documents in ~/.cache/hackersheet/documents/{workspace}/{slug}.json
  - **Complete Document Metadata**: Cache id, slug, title, content, and draft status
  - **`--refresh` Flag**: Use `docs show <slug> --refresh` to bypass cache
  - **Performance Improvement**: ~4.7x faster for cached document retrieval (0.093s vs 0.436s)
  - **Cache Clearing**: `cache clear` removes all caches (slugs + documents)

  ### Cache Directory Path Display
  - **`config path`**: Display configuration files and cache directory paths
  - **`-g, --global`**: Show only global configuration path
  - **`-l, --local`**: Show only project configuration path
  - **`-c, --cache`**: Show only cache directory path
  - XDG Base Directory Specification compliant

  ## Testing & Quality Improvements
  - **New Test File**: `docs-show-action.unit.test.ts` (14 tests)
  - **Expanded Test Coverage**: Cache functionality, cache clear, comprehensive error handling
  - **Total Tests**: 370 passing
  - **TypeScript Checks**: All passing
  - **ESLint**: Clean

  ## Architecture Improvements
  - **Separation of Concerns**: Clear distinction between global and project configuration
  - **Dependency Injection**: Improved testability with injectable dependencies
  - **Error Handling**: Prerequisite validation with user-friendly error messages
  - **XDG Compliance**: Standard ~/.cache and ~/.config directory usage

## 0.1.0-alpha.7

### Patch Changes

- 175d7dd: Add config command for managing CLI configuration
  - Add `config` command with subcommands: `get`, `set`, `list`, `init`, `delete`, `path`
  - Support multi-workspace configuration with fallback and merge functionality
  - Use XDG Base Directory Specification for user config path
  - Add terminal output colorization for better readability

## 0.1.0-alpha.6

### Patch Changes

- bbf4e48: Update dependencies
  - **next-document-content-components**: Update shiki packages to 3.22.0, mermaid to 11.12.2, and next (dev) to 16.1.6
  - **next-document-content-kifu**: Update next (dev) to 16.1.6
  - **react-document-content**: Update rehype-github-alerts to 4.2.0 and unist-util-visit to 5.1.0
  - **react-document-content-styles**: Update sass to 1.97.3
  - **core**: Update graphql to 16.12.0
  - **cli**: Update @inquirer/prompts to 8.2.0 and commander to 14.0.3

- Updated dependencies [bbf4e48]
  - @hackersheet/core@0.1.0-alpha.13

## 0.1.0-alpha.5

### Patch Changes

- Updated dependencies
  - @hackersheet/core@0.1.0-alpha.12
