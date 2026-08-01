# Deploy SmartLib to lib.bcic.site

1. Point the A record for `lib.bcic.site` to the VPS public IPv4 address and wait for DNS propagation.
2. Install Docker, Docker Compose plugin, Nginx, Certbot, and the Nginx Certbot plugin on the VPS.
3. Copy `.env.vps.example` to `.env`, replace `SESSION_SECRET`, and add SMTP credentials when email is enabled.
4. Start SmartLib with `docker compose up --build -d`. It listens only on `127.0.0.1:5080`. On a fresh persistent volume, Docker initializes the database from `backend/schema.sqlite`; later restarts preserve the existing library data.
5. Obtain the certificate before enabling the TLS server block:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d lib.bcic.site
```

6. Copy `deploy/nginx/lib.bcic.site.conf` to `/etc/nginx/sites-available/lib.bcic.site`, create the symlink in `sites-enabled`, then run `sudo nginx -t && sudo systemctl start nginx`.
7. Verify `https://lib.bcic.site/health`, login, session persistence after refresh, upload, and the API proxy. Certbot renewal should remain enabled with `systemctl enable --now certbot.timer`.
