#!/usr/bin/env sh
# Build the Aqarya SPA and copy it to the VPS that Caddy serves.
#
# Usage:
#   cp scripts/deploy.env.example scripts/deploy.env   # then edit it once
#   ./scripts/deploy.sh
#
# Requires: node/npm locally, plus ssh + rsync with key auth to the VPS.

set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

# ── Load config ─────────────────────────────────────────────────────────────
if [ -f scripts/deploy.env ]; then
	# shellcheck disable=SC1091
	. ./scripts/deploy.env
fi

: "${DEPLOY_USER:?set DEPLOY_USER in scripts/deploy.env}"
: "${DEPLOY_HOST:?set DEPLOY_HOST in scripts/deploy.env}"
: "${DEPLOY_PATH:?set DEPLOY_PATH in scripts/deploy.env}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

# ── Build ──────────────────────────────────────────────────────────────────
echo "==> Installing dependencies"
npm ci

echo "==> Building"
npm run build

if [ ! -f dist/index.html ]; then
	echo "!! dist/index.html not found — build did not produce output" >&2
	exit 1
fi

# ── Upload ─────────────────────────────────────────────────────────────────
echo "==> Ensuring $DEPLOY_PATH exists on $DEPLOY_HOST"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"

echo "==> Syncing dist/ -> $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
rsync -avz --delete -e "ssh -p $DEPLOY_PORT" dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo "==> Reloading Caddy"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
	"caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || systemctl reload caddy"

echo "==> Done. https://aqarya.online should now serve the new build."
