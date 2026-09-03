# Deploying Aqarya

Aqarya is a static single-page app — no backend, no database. It is served on the
VPS by an `nginx:alpine` container (`aqarya-web-1`) that bind-mounts the built
`dist/` folder. TLS + routing for `aqarya.online` is handled by the shared
`amanah-drive-caddy-1` container, which reverse-proxies to `aqarya-web-1:80` over
the `aqarya_internal` docker network.

```
Internet ──▶ amanah-drive-caddy-1 (:443)  ──aqarya_internal──▶ aqarya-web-1 (nginx, dist/)
```

## Publish the latest `main`

On the VPS:

```bash
cd /opt/aqarya
sh scripts/redeploy.sh
```

`redeploy.sh` does: `git pull` → build `dist/` in a throwaway `node:20` container →
reload nginx. Because `dist/` is bind-mounted into `aqarya-web-1`, the site is
live the moment the build finishes.

## One-time container setup (already done, for reference)

```bash
cat > /opt/aqarya/nginx-spa.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location / { try_files $uri /index.html; }
}
EOF

docker run --rm -v /opt/aqarya:/app -w /app node:20-alpine sh -c "npm ci && npm run build"

docker run -d --name aqarya-web-1 --restart unless-stopped \
  -p 127.0.0.1:8081:80 \
  -v /opt/aqarya/dist:/usr/share/nginx/html:ro \
  -v /opt/aqarya/nginx-spa.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine

docker network connect aqarya_internal aqarya-web-1
docker restart amanah-drive-caddy-1
```

The Caddyfile block (in the amanah-drive stack, not this repo) is:

```caddy
aqarya.online, www.aqarya.online {
    reverse_proxy aqarya-web-1:80
}
```

## Make `git push` deploy automatically (optional)

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs
`npm run verify` on every push. It will also SSH into the VPS and run
`scripts/redeploy.sh` once you enable it:

1. Create an SSH keypair for deploys; add the **public** key to
   `~/.ssh/authorized_keys` on the VPS (root, or a user that can run docker).
2. Repo → Settings → Secrets and variables → Actions:
   - Secrets: `DEPLOY_SSH_KEY` (private key), `DEPLOY_USER` (e.g. `root`),
     `DEPLOY_HOST` (e.g. `srv1931482` or its IP), `DEPLOY_PORT` (optional, `22`)
   - Variable: `DEPLOY_ENABLED` = `true`

Until `DEPLOY_ENABLED` is `true`, pushes only build and verify — nothing touches
the server.

## Verify

```bash
curl -sI https://aqarya.online     | head -1   # HTTP/2 200
curl -sI https://aqarya.online/app | head -1   # HTTP/2 200 (SPA fallback)
```
