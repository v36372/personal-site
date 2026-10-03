# Tin Nguyen — personal website

A small, dependency-free personal-site starter. Edit the files in `public/`;
no framework or build step is required.

## Project

- BB project: `tinnguyen` (`proj_p965in7xju`)
- Source: `/home/exedev/codes/tinnguyen` on `v36372-bb`
- Live URL: https://tinnguyen.exe.xyz/
- Host: new exe.dev VM `tinnguyen`, Singapore
- Base image: `ghcr.io/ryanlewis/exeslim:latest` at creation
- Resources: 1 vCPU, 2 GB RAM, 10 GB disk
- Server: nginx, managed by systemd, listening on port 8000
- Public assets: `/srv/tinnguyen/current` (symlink to a release)

exeslim is the minimal deployment image; development stays on the BB VM.
Only `public/` is uploaded and served. Source, tests, and operations files
are not part of the public site.

## Develop

```sh
make dev                  # http://127.0.0.1:3000
make test                 # site checks + script syntax checks
```

Start with `public/index.html` for content and `public/site.css` for styling.
The homepage is intentionally a placeholder: no invented bio, projects, or
contact details.

## Deploy

From this BB VM, the attached exe integration supplies authentication:

```sh
make deploy               # test, then deploy
# For a fresh exeslim VM only:
make setup                # install nginx, then deploy
```

From another machine with your exe.dev owner SSH access:

```sh
python3 scripts/deploy.py --ssh
# Add --setup on the first deployment to a fresh VM.
```

The script uploads only static assets, validates nginx configuration, swaps the
release symlink atomically, and checks the local HTTP endpoint. Old releases
are retained for manual rollback. HTTPS API uploads have a 64 KiB request limit;
use `--ssh` if the site grows beyond that. No credentials are stored here.

exe.dev handles TLS. The proxy is configured for port 8000 and public access.
To restore these settings using your owner SSH access:

```sh
ssh exe.dev share port tinnguyen 8000
ssh exe.dev share set-public tinnguyen
```

Only the static website on the default proxy port is public, not SSH access.

## Operations

```sh
ssh tinnguyen.exe.xyz 'sudo nginx -t; systemctl status nginx --no-pager'
ssh tinnguyen.exe.xyz 'sudo journalctl -u nginx -n 50 --no-pager'
ssh tinnguyen.exe.xyz 'ls -l /srv/tinnguyen/current /srv/tinnguyen/releases'
```

For rollback, point `/srv/tinnguyen/current` at a previous release using a
new symlink and `mv -Tf`, as the deploy script does. Nginx serves from that
symlink; no app rebuild is needed.

exeslim does **not** auto-update packages. Periodically review/apply Ubuntu
security updates (`sudo apt-get update && sudo apt-get dist-upgrade`) and
restart nginx afterward. VM image updates do not patch an existing VM.
