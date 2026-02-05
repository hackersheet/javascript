---
'@hackersheet/next-document-content-components': patch
'@hackersheet/cli': patch
---

Add config command for managing CLI configuration

- Add `config` command with subcommands: `get`, `set`, `list`, `init`, `delete`, `path`
- Support multi-workspace configuration with fallback and merge functionality
- Use XDG Base Directory Specification for user config path
- Add terminal output colorization for better readability
