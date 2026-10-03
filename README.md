# Tin Nguyen — a personal notebook

A text-first, Markdown-authored blog with an original design inspired by
[lucumr](https://github.com/mitsuhiko/lucumr): dated entries, readable articles,
a chronological archive, topic pages, and an RSS feed. The COBE globe remains
as a small location detail beside the introduction and on the About page.

Lucumr's repository is **not open source**. None of its code, templates, fonts,
assets, or posts have been copied. This implementation is independent.

## Project and privacy

- BB project: `tinnguyen` (`proj_p965in7xju`)
- Source: `/home/exedev/codes/tinnguyen` on `v36372-bb`
- Private preview: https://tinnguyen.exe.xyz/
- VM: `tinnguyen`, Singapore; `ghcr.io/ryanlewis/exeslim:latest` at creation
- Resources: 1 vCPU, 2 GB RAM, 10 GB disk
- Server: nginx on port 8000, managed by systemd
- Served files: `/srv/tinnguyen/current`, pointing at a generated release

**Keep the site private until Tin explicitly asks to publish.** The exe.dev
proxy requires owner authentication; anonymous visitors are redirected to
login. There are no public share links. Deployment checks private visibility
before uploading and refuses to deploy to a public VM. It never changes access.

The starter article is explicitly a **draft/layout preview**, not a published
post. No personal biography, employment, hobbies, or contact links are invented.

## Local development

Requirements on the development machine: Python 3.11+, `uv`, and Node.js 22.7+.
The deployment VM needs only nginx — no Python, Node, or development toolchain.
Python dependencies are pinned in `uv.lock`.

```sh
uv sync --locked
make dev       # http://127.0.0.1:3000; watches content, templates, and assets
make test      # builds private preview, then runs Python and Node tests
make preview   # generate dist/ with labeled drafts for private review
make build     # generate dist/ with published posts only
```

Refresh your browser after editing. The dev server binds only to localhost and
uses the production CSP. Failed builds leave the last successful preview intact.

## Writing a post

Add a Markdown file under `content/posts/`. Use TOML front matter:

```toml
+++
title = "My next post"
date = 2026-10-03
slug = "my-next-post"
description = "A short introduction for the index and RSS feed."
tags = ["Notes"]
draft = true
+++
```

Then write normal Markdown below the closing `+++`. Headings, links, lists,
quotes, fenced code blocks, and tables are supported. Raw HTML is escaped.

- Drafts default to `true` if the flag is omitted.
- Set `draft = false` when the writing is ready. This includes the post in the
  published build and feed; **it does not make the website publicly accessible**.
- Future-dated posts remain drafts until their date arrives.
- URLs use `/YYYY/MM/DD/slug/`; choose a stable slug and publication date.
- Descriptions are optional; otherwise the first text block is used.
- Drafts are never in RSS or the sitemap, even during private preview.
- Delete or replace `content/posts/2026-10-03-a-little-corner.md` before publishing
  real writing. It is only a specimen of the article layout.

Navigation, year groups, topic pages, reading times, and feeds are generated
from the posts. No manual index editing is needed.

## Layout and files

- `content/posts/`: editable Markdown posts
- `templates/`: original Jinja templates; edit `about.html` for the About page
- `public/`: CSS, favicon, and self-hosted globe assets only
- `scripts/build.py`: Markdown-to-HTML generator
- `scripts/serve.py`: local preview server with automatic rebuilds
- `scripts/deploy.py`: owner-authenticated static deployment with privacy guard
- `dist/`: generated output, ignored by Git; never edit by hand

## Globe

[COBE](https://github.com/shuding/cobe) is pinned to **2.0.1**; its official ES
module and MIT license are vendored in `public/vendor/`. There are no runtime
CDN requests. `public/globe-location.js` contains the city-level coordinates
**10.8231° N, 106.6297° E**, orientation, and label projection.

`public/globe.js` owns the render loop via COBE 2's `globe.update()`. Bounded
rotation keeps the city visible. Pause/play, reduced-motion preferences,
offscreen/hidden-tab suspension, and no-JavaScript/WebGL fallbacks are supported.
Articles do not load globe JavaScript, so reading works without JavaScript.

The CSP permits the embedded PNG with `img-src 'self' data:` and hash-allows
COBE's empty and `:root{}` style blocks. No `unsafe-inline` or `unsafe-eval` is
allowed. Bindable IDs are omitted to avoid dynamic styles and CSS-anchor browser
dependencies. Recheck the policy if upgrading COBE.

## Deploy privately

From the BB VM, the attached exe integration supplies authentication:

```sh
make deploy   # tests and builds a private preview, then uploads dist/ only
make setup    # first deployment to a fresh exeslim VM: install nginx, deploy
```

From another development machine, build first and use owner SSH access:

```sh
make preview
python3 scripts/deploy.py --ssh
```

Source Markdown, templates, tests, and secrets are **not** uploaded. The script
validates nginx configuration, swaps the release symlink atomically, and checks
local HTTP. Previous releases are retained for rollback. HTTPS API requests
have a 64 KiB limit; use `--ssh` if the generated site grows beyond that.

To restore private access (never enable public access while editing):

```sh
ssh exe.dev share port tinnguyen 8000
ssh exe.dev share set-private tinnguyen
```

Feeds and all article URLs remain behind the same private proxy authentication.
`make build` is a content build mode, not an instruction to publish or share.

## Operations

```sh
ssh tinnguyen.exe.xyz 'sudo nginx -t; systemctl status nginx --no-pager'
ssh tinnguyen.exe.xyz 'sudo journalctl -u nginx -n 50 --no-pager'
ssh tinnguyen.exe.xyz 'ls -l /srv/tinnguyen/current /srv/tinnguyen/releases'
```

For rollback, atomically point `/srv/tinnguyen/current` at an earlier release
using a new symlink and `mv -Tf`, as the deploy script does. No rebuild is needed.

exeslim does not auto-update packages. Periodically review/apply Ubuntu security
updates (`sudo apt-get update && sudo apt-get dist-upgrade`) and restart nginx.
VM image updates do not patch an existing VM.
