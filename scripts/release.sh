#!/bin/bash
set -euo pipefail

# Publish packages that have not been published yet
# Used by changesets/action in GitHub Actions

ROOT_DIR=$(pwd)
PACKAGES=$(pnpm -r --filter '@hackersheet/*' --filter '!@hackersheet/sandbox-*' exec pwd)
PUBLISHED=""

for dir in $PACKAGES; do
  cd "$dir"

  PKG_NAME=$(jq -r .name package.json)
  PKG_VERSION=$(jq -r .version package.json)

  if npm view "$PKG_NAME@$PKG_VERSION" version 2>/dev/null; then
    echo "Skip: $PKG_NAME@$PKG_VERSION (already published)"
  else
    echo "Publish: $PKG_NAME@$PKG_VERSION"
    pnpm pack
    npm publish *.tgz --access=public --tag alpha --provenance
    rm -f *.tgz

    if [ -n "$PUBLISHED" ]; then
      PUBLISHED="$PUBLISHED,$PKG_NAME@$PKG_VERSION"
    else
      PUBLISHED="$PKG_NAME@$PKG_VERSION"
    fi
  fi
done

cd "$ROOT_DIR"

echo ""
echo "Published packages: ${PUBLISHED:-none}"

# Create git tags for changesets/action to detect and create GitHub releases
if [ -n "$PUBLISHED" ]; then
  pnpm changeset tag
fi
