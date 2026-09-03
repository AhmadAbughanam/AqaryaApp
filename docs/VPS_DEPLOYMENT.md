# VPS deployment beside an existing project

This deployment does not replace or reconfigure the existing application. Aqarya runs as an independent Compose project and publishes its web service only on `127.0.0.1:8081`. The existing host reverse proxy routes the new domain to that private port.

## 1. Configure the Hostinger domain

In Hostinger's DNS zone, create an `A` record for the domain (or subdomain) pointing to the VPS public IPv4 address. Add `www` as either another `A` record or a `CNAME` to the root domain if it will be used. Only create an `AAAA` record when the VPS is configured for IPv6.

Wait until the record resolves to the VPS before requesting a TLS certificate:

```bash
dig +short aqarya.example.com
```

Replace `aqarya.example.com` throughout this guide with the real domain.

## 2. Install Aqarya in its own directory

Docker Engine and the Compose plugin must already be installed. Choose a directory separate from the existing project:

```bash
sudo systemctl enable --now docker
sudo mkdir -p /opt/aqarya
sudo chown "$USER":"$USER" /opt/aqarya
git clone https://github.com/AhmadAbughanam/AqaryaApp.git /opt/aqarya
cd /opt/aqarya
cp .env.vps.example .env
chmod 600 .env
```

Replace `POSTGRES_PASSWORD`, `JWT_SECRET`, and `ADMIN_PASSWORD` in `.env`. Use independent, URL-safe random values of at least 32 characters. Keep `HTTP_PORT=8081` and `TRUST_PROXY=2`, or select another unused loopback port after checking:

```bash
sudo ss -ltnp | grep ':8081 ' || true
```

Do not expose ports `8081`, `3000`, or `5432` through the VPS firewall.

## 3. Start the independent stack

```bash
cd /opt/aqarya
docker compose up -d --build
docker compose ps
docker compose exec backend npm run admin:bootstrap
curl -fsS http://127.0.0.1:8081/healthz
curl -fsS http://127.0.0.1:8081/api/health
```

The Compose project has the fixed name `aqarya`, so its containers, network, and PostgreSQL volume remain separate from the existing project. The services use `restart: unless-stopped`, so Docker starts them again after a VPS reboot.

## 4. Add the domain to host Nginx

These steps assume the existing public reverse proxy is Nginx installed on the VPS host. Copy the included template and replace the example domain:

```bash
sudo cp deploy/nginx/aqarya.conf.example /etc/nginx/sites-available/aqarya.conf
sudo nano /etc/nginx/sites-available/aqarya.conf
sudo ln -s /etc/nginx/sites-available/aqarya.conf /etc/nginx/sites-enabled/aqarya.conf
sudo nginx -t
sudo systemctl reload nginx
```

Confirm plain HTTP routing before enabling TLS:

```bash
curl -I http://aqarya.example.com/healthz
```

If the current reverse proxy is Caddy, Traefik, or an Nginx container rather than host Nginx, do not install this site file. Route the domain to the Aqarya web service using that proxy's existing network and conventions.

## 5. Enable HTTPS

For host Nginx on Ubuntu or Debian, use the Certbot Nginx integration already used by the VPS, or install it first:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aqarya.example.com -d www.aqarya.example.com
sudo certbot renew --dry-run
```

Omit the `www` option when no `www` DNS record was created. Verify the application at `https://aqarya.example.com` after Certbot reloads Nginx.

## Updates

```bash
cd /opt/aqarya
git pull --ff-only
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:8081/healthz
```

Database migrations run before each API start. Take a PostgreSQL backup before deploying migrations. Avoid indiscriminate image pruning when the VPS hosts other applications.

## Backups and recovery

Create scheduled `pg_dump` backups, encrypt them, and copy them off the VPS. Test restoration regularly; a Docker volume is persistence, not a backup. Keep the previous Git revision and images until health checks pass. Application rollback is a Git checkout plus `docker compose up -d --build`; database rollback requires a tested migration and backup-restore plan.
