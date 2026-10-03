# Tin Nguyen — personal website

A small, build-free personal site with a self-hosted COBE globe. Edit the files
in `public/`; no framework, package install, or build step is required. Local
tests use Python 3 and Node.js 22+; the deployment VM needs only nginx.

## Project

- BB project: `tinnguyen` (`proj_p965in7xju`)
- Source: `/home/exedev/codes/tinnguyen` on `v36372-bb`
- Live URL: https://tinnguyen.exe.xyz/
- Host: new exe.dev VM `tinnguyen`, Singapore
- Base image: `ghcr.io/ryanlewis/exeslim:latest` at creation
- Resources: 1 vCPU, 2 GB RAM, 10 GB disk
- Server: nginx, managed by systemd, listening on port 8000
- Served assets: `/srv/tinnguyen/current` (symlink to a release)
- Visibility: **private**, protected by exe.dev owner authentication while editing

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
contact details. The location is Ho Chi Minh City, Vietnam, as supplied by Tin.

## Globe

- Library: [COBE](https://github.com/shuding/cobe), pinned to **2.0.1**.
- The official npm ES module and MIT license are vendored in `public/vendor/`.
  There are no runtime CDN requests or npm dependencies to install.
- Coordinates: **10.8231° N, 106.6297° E** (city-level, not a precise address).
- `public/globe-location.js` holds the coordinates, starting orientation,
  and label projection; `public/globe.js` initializes and animates COBE.
- The globe gently rotates around Vietnam without hiding the marker. It
  respects reduced-motion preferences, has a pause/play button, and suspends
  rendering when offscreen or the tab is hidden.
- The location remains readable without JavaScript or WebGL.
- COBE 2 uses `globe.update()`; our code owns the render loop, not an
  `onRender` callback from older examples.

The nginx CSP permits COBE's embedded PNG via `img-src 'self' data:` and
hash-allows its empty and `:root{}` style blocks (including text replacement).
Everything else remains same-origin; no `unsafe-inline` or `unsafe-eval` is
enabled. Bindable marker
IDs are intentionally omitted to avoid dynamic inline stylesheet rules and
CSS-anchor browser dependencies. Recheck this policy if upgrading COBE.

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

exe.dev handles TLS. The proxy is configured for port 8000 and **private**
access. Anonymous visitors are redirected to exe.dev login. Keep it private
until Tin explicitly asks to publish; normal deployments do not change access.

To restore the private settings using your owner SSH access:

```sh
ssh exe.dev share port tinnguyen 8000
ssh exe.dev share set-private tinnguyen
```

Do not enable public access or create share links while the site is being edited.

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
