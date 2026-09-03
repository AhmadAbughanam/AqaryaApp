#!/usr/bin/env sh
# Run this ON the VPS (in /opt/aqarya) to publish the latest main.
#
#   ssh root@srv1931482 'cd /opt/aqarya && ./scripts/redeploy.sh'
#
# It pulls, rebuilds the static site into ./dist (which is bind-mounted into the
# aqarya-web-1 nginx container), so the change is live as soon as the build ends.

set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

echo "==> git pull"
git pull --ff-only

echo "==> build (throwaway node container)"
docker run --rm -v "$PWD":/app -w /app node:20-alpine sh -c "npm ci && npm run build"

test -f dist/index.html || { echo "!! build produced no dist/index.html" >&2; exit 1; }

# nginx serves the bind-mounted dist/ directly, but reload to drop any cached fds.
docker exec aqarya-web-1 nginx -s reload 2>/dev/null || docker restart aqarya-web-1

echo "==> live:"
curl -sI https://aqarya.online | head -1
