# Tin Nguyen — a personal notebook

A compact personal notebook inspired by [ludwigabap.com](https://ludwigabap.com/):
warm monospace UI, writing and bookmarks tabs, dense saved-link lists, search,
filters, and timeline browsing. Readable Markdown articles, topics, and RSS
remain from the earlier lucumr-inspired blog. Writing is listed on the home page;
there is no separate Archive page. A larger COBE globe marks Ho Chi Minh City
on About only. Warm/light/dark themes are saved locally. Animated Capy-style dither bands frame the top and bottom of
every page, never behind reading content. There are no third-party fonts,
analytics, or runtime requests.

Lucumr's repository is **not open source**. None of its code, templates, fonts,
assets, or posts have been copied. This implementation is independent.

## Project and privacy

- Repository: https://github.com/v36372/personal-site (**public source code**)
- BB project: `tinnguyen` (`proj_p965in7xju`)
- Source: `/home/exedev/codes/tinnguyen` on `v36372-bb`
- Website (owner-only Access): https://tinnguyen.pages.dev/
- Hosting: Cloudflare Pages; assets served from Cloudflare's global edge
- Build: native Pages GitHub integration, `main` → `bash ops/pages-build.sh` → `dist/`
- Account: `700a6c6ad6178d92f1abcf67630f3a95`; project: `tinnguyen`
- Legacy VM: `tinnguyen.exe.xyz`, kept private as a rollback copy only

**Keep the site private until Tin explicitly asks to publish.** Cloudflare
Access requires the owner's existing Google login. Its application protects
**both** `tinnguyen.pages.dev` and `*.tinnguyen.pages.dev`, including immutable
deployment URLs. Anonymous requests redirect to Access; previews are disabled.
The rebuild helper verifies owner-only policies and anonymous login redirects
before deploying and never changes access settings. `noindex` is not a privacy
barrier; keep Access enabled even though the source repository is public.

The starter article remains an unpublished, source-only layout specimen. It is
not included in the deployed site. No biography or published writing is invented.
There is no custom favicon, preview badge, banner control, or unfinished-site
copy. Empty collections use neutral messages rather than promises of future content.

## Local development

Requirements on the development machine: Python 3.11+, `uv`, and Node.js 22.7+.
Cloudflare's v3 build image uses Python 3.12 and Node 22.20.0;
`ops/pages-build.sh` installs pinned uv 0.12.7 and runs the same tests locally
and on Pages. Python dependencies are pinned in `uv.lock`.

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

Navigation, topic pages, reading times, and feeds are generated
from the posts. No manual index editing is needed.

## Bookmarks

Tin chose to **set up the tab first**. The collection is intentionally empty;
no bookmarks have been invented, copied from the reference, or fetched from an
account. A browser/service export can be imported later when supplied.

The source is `content/bookmarks.json`, an array of saved-link objects. For
example, this describes the schema (it is not an actual saved bookmark):

```json
[
  {
    "title": "An article I saved",
    "url": "https://example.org/article",
    "kind": "article",
    "saved": "2026-10-03",
    "tags": ["Reading"],
    "note": "An optional personal note.",
    "publish": false
  }
]
```

- Kinds: `link` (default), `article`, `video`, `paper`.
- Dates are optional; unknown dates remain unrecorded, never fabricated.
- Every entry is rendered, not only the latest 200. Search covers titles, URLs,
  notes, and tags. Type/tag filters and list/timeline views work locally in the
  browser. Without JavaScript, the full list remains readable.
- Imported links default to **private** (`publish: false`). Private preview
  includes them all. `make build` includes only explicitly reviewed links with
  `publish: true`, avoiding accidental publication of a personal collection.
- The raw JSON file is not uploaded. Bookmark links never enter the writing RSS
  feed. HTTP(S) only; embedded credentials and executable URLs are rejected.
- To add/change entries, edit the JSON and run `make deploy`. No changes to
  website visibility occur.

## Layout and files

- `content/posts/`: editable Markdown posts
- `content/bookmarks.json`: saved links (currently an empty collection)
- `scripts/bookmarks.py`: bookmark validation and safe privacy defaults
- `templates/`: original Jinja templates; edit `about.html` for the About page
- `public/`: CSS, self-hosted renderers/shaders, and static fallbacks (no favicon)
- `scripts/build.py`: Markdown-to-HTML generator
- `scripts/serve.py`: local preview server with automatic rebuilds
- `public/_headers`: Pages security headers, CSP, noindex, and pinned-vendor caching
- `ops/pages-build.sh`: native Pages build and full test command
- `scripts/deploy_pages.py`: owner-only Access check and committed-main rebuild
- `scripts/deploy.py`: legacy VM uploader with private-visibility guard
- `dist/`: generated output, ignored by Git; never edit by hand

## Globe

[COBE](https://github.com/shuding/cobe) is pinned to **2.0.1**; its official ES
module and MIT license are vendored in `public/vendor/`. There are no runtime
CDN requests. `public/globe-location.js` contains the city-level coordinates
**10.8231° N, 106.6297° E** and the city-centered orientation.

`public/globe.js` owns the render loop via COBE 2's `globe.update()`. Bounded
rotation keeps the city visible. Pause/play, reduced-motion preferences,
offscreen/hidden-tab suspension, and no-JavaScript/WebGL fallbacks are supported.
The globe appears ONLY in the About content, beside the introduction on desktop
and stacked below it on mobile. Its square is **240px desktop / 200px mobile**.
A small caption names the city. The shared header has no globe; other pages do
not load its script or COBE, keeping GPU work and downloads off the writing page.
The larger renderer uses 16,000 map samples, bounded 30fps animation, and DPR ≤2.
Click or keyboard-activate the globe to pause/play it and both dither bands;
the choice is remembered throughout the tab. The tooltip/accessible name retain
the city. An SVG is the no-JavaScript/WebGL fallback. Reading still works without JS.

The CSP permits the embedded PNG with `img-src 'self' data:` and hash-allows
COBE's empty and `:root{}` style blocks. No `unsafe-inline` or `unsafe-eval` is
allowed. Bindable IDs are omitted to avoid dynamic styles and CSS-anchor browser
dependencies. Recheck the policy if upgrading COBE.

## Animated dither header and footer

The art strip is inspired by lucumr's top-of-page composition and adapted from
[Aura's Capy renderer](https://github.com/MateoCerquetella/bb-plugins/tree/acaa0378891adb6fc4d6c643b4c939ecfb1997c2/plugins/aura/lib).
Both bands are **180px tall on desktop, 120px on mobile**, full-width. A long,
eased multi-stop mask fades each band toward the body (the footer reverses the
header fade), with no hard gradient shoulder. The rest of the page has no
shader/wallpaper layers. Noise drifts at 0.35× speed, slower than the original.

How the effect works:

1. A full-screen WebGL2 quad runs Paper Shaders' fragment shader. Two layers
   of animated simplex noise produce a drifting field of brightness.
2. An **8×8 Bayer matrix** thresholds that field into foreground/background
   pixels, rather than a smooth photographic gradient.
3. The framebuffer is **one-third CSS resolution**, scaled up with
   `image-rendering: pixelated`. This gives approximately **3px dither cells**
   without paying for full-retina shading.
4. The foreground comes from the theme's accent. Mirrored CSS masks ease the
   art to transparent at each body-facing edge, leaving reading entirely clear.

Files and tuning:

- `public/header-art.js`: shared header/footer renderer and lifecycle; at most
  15 fps per visible band on one animation clock. No visible banner buttons;
  the About globe pauses/plays all animations via motionchange.
  Offscreen bands initialize lazily; hidden tabs/offscreen bands do not animate.
  Reduced motion renders static art.
- `public/dither-settings.js`: Capy's noise/Bayer settings, 0.35× clock speed,
  initial phase 40, and GPU caps (96,000 pixels / 4096px maximum side per band).
- `templates/_header-art.html` (parameterized by position) and `public/site.css`:
  decorative structure, height, and mirrored eased fades, without controls.
- `public/header-art-fallback.svg`: original static Bayer-cloud art used
  without JavaScript/WebGL or after context loss.

The shader module is copied byte-for-byte from Aura's pinned revision above
(extension changed to .js). It is Paper Shaders **Apache-2.0**; the renderer
adapter is **MIT**. Licenses, source hashes, Capy provenance, and modification
notices are shipped in `public/vendor/DITHER-NOTICES.txt` and adjacent files.
No Capy service, tracking, app code, product assets, or Lucumr code is copied.

## Automatic private deployment (Cloudflare Pages)

Push a tested commit to `main` in `v36372/personal-site`. Cloudflare's native
GitHub integration builds and tests it with `bash ops/pages-build.sh`, then
serves only `dist/` at https://tinnguyen.pages.dev/. No exe.dev VM serves the
new website, and no self-hosted runner or GitHub deploy secret is needed.

Configuration:

- Production branch: `main`; production auto-deployment enabled.
- Build command: `bash ops/pages-build.sh`; output directory: `dist/`.
- Build image: v3; `PYTHON_VERSION=3.12`, `NODE_VERSION=22.20.0`,
  `SKIP_DEPENDENCY_INSTALL=true`. Disable Pages' automatic `pip install .`: this
  is a scripts-only uv project, not an installable package. The build command
  installs pinned tooling and uses `uv.lock` itself.
- Run tests against a local draft preview, then regenerate with `make build`.
  The deployed site includes only published posts and reviewed bookmarks.
  Drafts (including the layout specimen) remain in source/local preview only.
  This content build mode does NOT disable Access or publish the website.
- Branch and PR preview deployments: disabled. The Access wildcard still
  protects every generated deployment URL, including production hashes.
- Access application: `1add1fd3-ef6b-4897-ac60-390c5b60440b`, owner-only Google
  login, 24-hour sessions, main AND wildcard Pages hosts. Never add bypasses.
- `public/_redirects` permanently redirects the removed `/archive` and
  `/archive/` URLs to `/`. No archive is generated or listed in the sitemap;
  the writing page lists all published entries without a five-post cap.
- `public/_headers` preserves the nginx CSP/security headers. Version-pinned
  vendor assets get a one-year browser cache; Pages handles edge caching,
  compression, HTTPS, and conditional requests for the remaining files.
- `.github/workflows/deploy.yml` now runs **checks only**, on GitHub-hosted
  runners. Pages independently runs all checks before publishing. PR code
  never executes on the old self-hosted runner.

From the BB VM, the attached Cloudflare integration supplies authentication
without exposing the API token:

```sh
make test
git push origin main                   # native Pages auto-deployment
python3 scripts/deploy_pages.py --check # verify owner-only protection
make deploy                            # rebuild committed GitHub main
```

`make deploy` does **not** upload uncommitted local changes. Commit and push
first. Its privacy guard checks the Access configuration and actual anonymous
requests to both the main and wildcard hosts. From another machine, set
`CLOUDFLARE_API_URL=https://api.cloudflare.com/client/v4`, a scoped
`CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCESS_EMAIL` to the owner's login email.
Keep credentials outside the repository.

Canonical, RSS, and sitemap URLs default to `https://tinnguyen.pages.dev`.
Override `SITE_URL` when building for a future custom domain. The old
`*.exe.xyz` hostname belongs to exe.dev and cannot be reassigned as a Pages
custom domain without its DNS owner. No unrelated DNS records were changed.

Inspect builds and roll back in the Cloudflare Pages dashboard:

https://dash.cloudflare.com/700a6c6ad6178d92f1abcf67630f3a95/pages/view/tinnguyen

GitHub checks: https://github.com/v36372/personal-site/actions

## Legacy VM rollback copy

The private nginx copy at https://tinnguyen.exe.xyz/ is retained, not updated
automatically. The `tinnguyen-ci` runner service has been stopped and its VM
deploy integration detached. Neither VM has been deleted; request removal
when the rollback copy is no longer needed.

The old scripts remain available for an explicit VM rollback:

```sh
SITE_URL=https://tinnguyen.exe.xyz make deploy-vm
SITE_URL=https://tinnguyen.exe.xyz make setup-vm
# Or, after a preview build, use owner SSH:
python3 scripts/deploy.py --ssh
```

These commands preserve the legacy VM's private access. Source, secrets, and
runner state are never uploaded; nginx serves only `/srv/tinnguyen/current`
on port 8000. Existing releases are retained for atomic symlink rollback.

**The repository is public, even though the website is private.** Do not commit
confidential drafts, private bookmarks, tokens, or personal exports. A draft
flag controls rendered output, not GitHub source visibility. Make the repo
private or use a separate private data source for confidential content.
