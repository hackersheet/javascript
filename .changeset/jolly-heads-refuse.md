---
'@hackersheet/cli': minor
---

## Major Features and Improvements

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
