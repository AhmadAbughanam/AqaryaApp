#!/bin/bash

FILE="$1"

if [ -z "$FILE" ]; then
  exit 0
fi

case "$FILE" in
  ./backend/*|backend/*)
    if [ -x "./backend/node_modules/.bin/tsc" ]; then
      ./backend/node_modules/.bin/tsc --noEmit --project backend/tsconfig.json --pretty false >/dev/null 2>&1 || \
        echo "[.claude/hooks] Backend typecheck failed after editing $FILE"
    fi
    ;;
  *.ts|*.tsx|*.js|*.jsx)
    if [ -x "./node_modules/.bin/eslint" ]; then
      ./node_modules/.bin/eslint "$FILE" --quiet --fix >/dev/null 2>&1 || \
        echo "[.claude/hooks] Root lint failed after editing $FILE"
    fi
    if [ -x "./node_modules/.bin/tsc" ]; then
      ./node_modules/.bin/tsc --noEmit --pretty false >/dev/null 2>&1 || \
        echo "[.claude/hooks] Root typecheck failed after editing $FILE"
    fi
    ;;
esac

exit 0
