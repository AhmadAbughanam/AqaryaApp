# Deploying Aqarya

Aqarya is a static single-page app (no backend). Deploying = build it, copy the
`dist/` folder to the VPS, and let Caddy serve it over HTTPS.

## One-time server setup

1. **Pick a web root**, e.g. `/var/www/aqarya`, and create it:
   ```bash
   sudo mkdir -p /var/www/aqarya
   sudo chown "$USER" /var/www/aqarya
   ```

2. **Point Caddy at it.** Copy the `aqarya.online` site block from [`Caddyfile`](./Caddyfile)
   into your server's `/etc/caddy/Caddyfile`, replacing any existing
   `reverse_proxy` block for this domain. Then:
   ```bash
   sudo caddy reload --config /etc/caddy/Caddyfile   # or: sudo systemctl reload caddy
   ```
   The `try_files {path} /index.html` line is what makes `/app`, `/admin`, and
   `/login` survive a page refresh.

3. The old Docker Compose / container setup is no longer used — nothing listens
   on an app port anymore.

## Deploying a new version

### Option A — from your machine (script)

```bash
cp scripts/deploy.env.example scripts/deploy.env   # fill in USER / HOST / PATH once
./scripts/deploy.sh
```

This runs `npm ci`, `npm run build`, `rsync`s `dist/` to the VPS, and reloads
Caddy. Needs `ssh` + `rsync` with key auth to the server. `scripts/deploy.env`
is git-ignored.

### Option B — manual

```bash
npm ci && npm run build
rsync -avz --delete dist/ USER@HOST:/var/www/aqarya/
ssh USER@HOST 'sudo systemctl reload caddy'
```

### Option C — automatic on every push to `main` (GitHub Actions)

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builds and runs
`npm run verify` on every push. It will also deploy to the VPS **once you enable
it**:

1. Create an SSH keypair used only for deploys; add the **public** key to
   `~/.ssh/authorized_keys` on the VPS.
2. In the GitHub repo → Settings → Secrets and variables → Actions, add:
   - Secret `DEPLOY_SSH_KEY` — the **private** key
   - Secret `DEPLOY_USER`, `DEPLOY_HOST`, `DEPLOY_PATH` (e.g. `/var/www/aqarya`)
   - Secret `DEPLOY_PORT` — optional, defaults to `22`
   - **Variable** `DEPLOY_ENABLED` = `true`
3. If Caddy reload needs sudo, give the deploy user a passwordless sudoers entry
   for `systemctl reload caddy`.

Until `DEPLOY_ENABLED` is set, the workflow only builds and verifies — it never
touches the server.

## Verify after deploy

```bash
curl -I https://aqarya.online            # 200, text/html
curl -I https://aqarya.online/app        # 200 (SPA fallback), not 404
```
