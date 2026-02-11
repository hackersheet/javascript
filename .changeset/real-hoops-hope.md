---
'@hackersheet/cli': patch
---

feat: enhance init command scaffold and protect workspace credentials in config

- `init` command now creates a complete project scaffold: templates, docsDirs, assets, README.md, .gitignore, .hsignore with step-by-step progress output
- `config set` rejects workspace/defaultWorkspace keys in project config and guides users to use `--global` flag
- `config init` without `--global` no longer prompts for workspace credentials
- Refactor action functions for improved readability and type safety
