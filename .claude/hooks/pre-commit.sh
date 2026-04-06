#!/bin/bash

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AqaryaApp pre-commit checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "${YELLOW}! No git repository detected. Skipping pre-commit checks.${NC}"
  exit 0
fi

STAGED="$(git diff --cached --name-only --diff-filter=ACMR)"
if [ -z "$STAGED" ]; then
  echo -e "${GREEN}✓ No staged files${NC}"
  exit 0
fi

ROOT_CHANGED="$(echo "$STAGED" | grep -E '^(App\.tsx|src/|__tests__/|index\.js|package\.json|tsconfig\.json|babel\.config\.js|metro\.config\.js|jest\.config\.js)' || true)"
BACKEND_CHANGED="$(echo "$STAGED" | grep -E '^backend/' || true)"
ROOT_STAGED_LINT="$(echo "$STAGED" | grep -E '^(App\.tsx|src/|__tests__/|index\.js|package\.json|babel\.config\.js|metro\.config\.js|jest\.config\.js|\.eslintrc\.js).*\.(ts|tsx|js|jsx)$' || true)"

if [ -n "$ROOT_CHANGED" ]; then
  echo -e "\n${YELLOW}[1/4] Root TypeScript check...${NC}"
  if [ -x "./node_modules/.bin/tsc" ]; then
    npm run typecheck
    if [ $? -ne 0 ]; then
      echo -e "${RED}✗ Root typecheck failed.${NC}"
      exit 2
    fi
    echo -e "${GREEN}✓ Root typecheck passed${NC}"
  else
    echo -e "${YELLOW}! Root dependencies not installed. Skipping root typecheck.${NC}"
  fi

  echo -e "\n${YELLOW}[2/4] Linting staged root files...${NC}"
  if [ -n "$ROOT_STAGED_LINT" ] && [ -x "./node_modules/.bin/eslint" ]; then
    ./node_modules/.bin/eslint $ROOT_STAGED_LINT --quiet
    if [ $? -ne 0 ]; then
      echo -e "${RED}✗ Root lint failed on staged files.${NC}"
      exit 2
    fi
    echo -e "${GREEN}✓ Root lint passed${NC}"
  else
    echo -e "${GREEN}✓ No root JS/TS files to lint${NC}"
  fi

  echo -e "\n${YELLOW}[3/4] Running root tests...${NC}"
  if [ -x "./node_modules/.bin/jest" ]; then
    npm test
    if [ $? -ne 0 ]; then
      echo -e "${RED}✗ Root tests failed.${NC}"
      exit 2
    fi
    echo -e "${GREEN}✓ Root tests passed${NC}"
  else
    echo -e "${YELLOW}! Root test dependencies not installed. Skipping root tests.${NC}"
  fi
fi

if [ -n "$BACKEND_CHANGED" ]; then
  echo -e "\n${YELLOW}[4/4] Backend build...${NC}"
  if [ -d "./backend/node_modules" ]; then
    npm --prefix backend run build
    if [ $? -ne 0 ]; then
      echo -e "${RED}✗ Backend build failed.${NC}"
      exit 2
    fi
    echo -e "${GREEN}✓ Backend build passed${NC}"
  else
    echo -e "${YELLOW}! Backend dependencies not installed. Skipping backend build.${NC}"
  fi
fi

echo ""
echo -e "${GREEN}✓ Pre-commit checks completed${NC}"
exit 0
