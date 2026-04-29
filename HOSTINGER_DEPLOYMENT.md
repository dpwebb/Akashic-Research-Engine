# Hostinger VPS Production Deployment

This app follows the same management rules as the other current online applications:

- GitHub is the source of truth.
- Hostinger runs a Docker service from a checked-out GitHub commit.
- Traefik routes the production domain to the app container.
- Rollbacks deploy a known GitHub commit SHA.

## Production Service

Domain:

```text
https://akashicresearch.info
https://www.akashicresearch.info
```

Service:

```text
container: akashic-research-engine
port: 3500
repo path on VPS: /opt/akashic-research-engine/app
```

## DNS

Point the domain to the Hostinger VPS:

```text
A record: @   -> <Hostinger VPS IPv4>
A record: www -> <Hostinger VPS IPv4>
```

Alternatively, `www` can point at the root domain:

```text
CNAME record: www -> akashicresearch.info
```

Do not point `www` to any non-Hostinger deployment host; this application is served by Hostinger VPS.

## One-Time VPS Setup

On the Hostinger VPS:

```bash
sudo mkdir -p /opt/akashic-research-engine
sudo chown -R "$USER":"$USER" /opt/akashic-research-engine
cd /opt/akashic-research-engine
git clone https://github.com/dpwebb/Akashic-Research-Engine.git app
cd app
npm ci
npm run typecheck
npm run build
npm run build:site
docker compose up -d --build akashic-research-engine
```

The VPS must already have Docker and the Hostinger Traefik stack available, matching the other apps.

## GitHub Environment Secrets

Create or reuse the `production` environment in GitHub Actions with:

- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`
- `PRODUCTION_SSH_PORT` optional, defaults to `22`

`PRODUCTION_SSH_PRIVATE_KEY` must be an OpenSSH private key for the VPS deploy user. It must not be the `.pub` public key, a key fingerprint, or a PuTTY `.ppk` file.

Accepted formats:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

or a base64-encoded OpenSSH private key.

To create a deploy key on this PC or another trusted machine:

```bash
ssh-keygen -t ed25519 -C "akashic-research-engine-deploy" -f ./akashic_research_engine_deploy
```

Add the public key to the VPS deploy user's `~/.ssh/authorized_keys`, then store the private key content from `akashic_research_engine_deploy` in the GitHub secret.

## Production Checks

Before manual deployments from this PC:

```bash
npm run check:source-of-truth
```

On the VPS, basic service checks:

```bash
docker ps -a | grep akashic-research-engine
curl -k -I https://akashicresearch.info
curl http://127.0.0.1:3500/health
```

## Updating Production

Normal updates happen through GitHub Actions after pushing to `main`.

Manual equivalent on the VPS:

```bash
cd /opt/akashic-research-engine/app
git fetch --prune origin
git checkout <known-github-commit-sha>
npm ci
npm run typecheck
npm run build
npm run build:site
docker rm -f akashic-research-engine 2>/dev/null || true
docker compose up -d --build akashic-research-engine
```
