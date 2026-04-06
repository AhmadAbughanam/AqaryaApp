#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  echo "No .git directory found. Run this from the real AqaryaApp git checkout."
  exit 1
fi

HOOK_DIR="$(git -C "$PROJECT_ROOT" rev-parse --git-path hooks)"
mkdir -p "$HOOK_DIR"

ln -sf "$PROJECT_ROOT/.claude/hooks/pre-commit.sh" "$HOOK_DIR/pre-commit"
chmod +x "$PROJECT_ROOT/.claude/hooks/pre-commit.sh" "$HOOK_DIR/pre-commit"

echo "Installed pre-commit hook -> $HOOK_DIR/pre-commit"
