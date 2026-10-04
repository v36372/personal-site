# Tin Nguyen — a personal notebook

A compact personal notebook inspired by [ludwigabap.com](https://ludwigabap.com/):
warm monospace UI, Reading → Writing → About navigation, dense saved-link lists, search,
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
- Website: https://tinng.exe.xyz/ (**private**, exe.dev owner login)
- Hosting: one exeslim VM in Singapore, 1 CPU / 2GB RAM / 10GB disk
- Updates: trusted GitHub `main` → tests → reviewed build → atomic nginx release
- Checks: GitHub-hosted runners; **no dedicated CI VM**
- Confirmed profiles: [GitHub](https://github.com/v36372) and [X](https://x.com/v36372)
- VM name: `tinng` (the original VM was renamed, not replaced)

**Keep the site private until Tin explicitly asks to publish.** exe.dev gates
the HTTPS proxy; nginx serves only generated HTML/assets on port 8000. Deploys
check private sharing and never change visibility. `noindex` is not an access
barrier. GitHub source remains public even though the website is private.

The starter article remains an unpublished, source-only layout specimen. It is
not included in the deployed site. No biography or published writing is invented.
There is no custom favicon, preview badge, banner control, or unfinished-site
copy. Empty collections use neutral messages rather than promises of future content.

## Local development

Requirements on the development machine: Python 3.11+, `uv`, and Node.js 22.7+.
The VM uses Python 3.12, verified Node 24.20.0, and pinned uv 0.12.7.
GitHub checks use Python 3.12 / Node 22.20.0. Both run the same suite.
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

Navigation, topic pages, reading times, and feeds are generated
from the posts. No manual index editing is needed.

## Reading

The Reading tab lives at `/reading/` and comes first in navigation, followed
by Writing and About. Old `/bookmarks` URLs redirect here, preserving searches.
The underlying bookmark data/schema/filter implementation keeps its names.

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
- `ops/bootstrap.sh`: verified VM tooling and nginx installation
- `ops/vm-update.sh`, `ops/tinnguyen-update.*`: trusted-main update service/timer
- `scripts/deploy.py`: atomic uploader/local updater with private-visibility guard
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
The city has an on-globe **HCMC** label; there is no city caption below it.
The shared header has no globe; other pages do not load its script or COBE,
keeping GPU work and downloads off the writing page.
The larger renderer uses 16,000 map samples, bounded 30fps animation, and DPR ≤2.
Click or keyboard-activate the globe to pause/play it and both dither bands;
the choice is remembered throughout the tab. The tooltip/accessible name retain
the city. An SVG is the no-JavaScript/WebGL fallback. Reading still works without JS.

By default (including denied/unavailable location), **only Ho Chi Minh City**
is marked, with no arcs or Singapore marker. Clicking **Connect your location**
explicitly requests a one-shot browser location. After permission and a valid
position, arcs connect each pair of HCMC, **You**, and **SGP** (Singapore city
center, the hosting region rather than a precise VM address). The view reframes
all three markers, including distant visitors. Visitor coordinates are rounded
to 0.1° immediately and remain in memory only: no IP lookup, geocoding service,
watcher, storage, analytics, or upload. **Remove my location**, permission
revocation, and leaving the page (including back/forward cache) restore the
home-only view. Errors and timeouts also retain that default.
`public/globe-geolocation.js` owns consent/lifecycle; `globe-location.js` owns
coarse coordinates, connections, and projection.

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

## Automatic private deployment (one VM)

Push a tested commit to `main` in `v36372/personal-site`. The website VM’s
`tinnguyen-update.timer` polls that branch approximately every minute. It fetches
only the pinned public repository (no GitHub credential), verifies private VM
visibility, runs `make test`, then `make build` to discard the local draft preview.
Only a successful reviewed-content build is atomically installed in
`/srv/tinnguyen/releases/`; nginx serves `/srv/tinnguyen/current`. Failed checks
leave the previous release and deployed commit unchanged.

- No Actions runner on the website/BB VM. PRs/forks are never fetched there.
- GitHub Actions uses disposable hosted runners for checks; no VM secrets.
- The updater is a systemd timer, not a public webhook/server.
- A file lock prevents concurrent updates. Logs: `journalctl -u tinnguyen-update`.
- `personal-site-status.int.exe.xyz` is a vaulted, read-only integration on the
  website VM. Its 1-year signing key permits only `share show`, not shell,
  management or sharing changes. Rotate before expiry (2027-10-03).
- Canonical/RSS/sitemap URLs default to `https://tinng.exe.xyz`.
- The original VM is `tinng`. Local updates verify VM identity to prevent
  deploying on a duplicate or missing a rename. Internal `/srv/tinnguyen` paths
  and `tinnguyen-update.*` unit names are unchanged; these are not public URLs.
- The larger About globe, dither bands, and finished UI are unchanged.
- nginx handles `/archive` and `/archive/` → `/`, `/bookmarks` → `/reading/`
  (including query parameters), relative directory
  redirects behind HTTPS, gzip, noindex, and immutable vendor caching.
  Ordinary assets revalidate to avoid mixing old JS/CSS with new HTML.

Manual deployment from BB uses the existing owner exe integration:

```sh
make deploy        # tests, reviewed build, private guard, atomic upload
make setup-vm      # also install nginx and verified tools on exeslim
python3 scripts/deploy.py --check
# Or use owner SSH after make build:
python3 scripts/deploy.py --ssh
```

Source, credentials and updater state never enter the web root. Retained
releases support atomic symlink rollback. Install the public service files
`ops/vm-update.sh` and `ops/tinnguyen-update.{service,timer}` on the VM; the stable
updater is `/usr/local/libexec/tinnguyen-update`. Its git checkout lives at
`/home/exedev/personal-site`, outside the served tree.

## Retired hosting

`tinnguyen-ci` was the dedicated self-hosted GitHub runner for the first VM
pipeline. It is deleted; its deploy integration and signing key were removed.
Do not recreate it. GitHub’s old offline runner record may remain because this
integration cannot manage runner registrations; it has no running VM and can
be removed in Settings → Actions → Runners. No new runner token is needed.

All Cloudflare deployment helpers, build commands, tests and public configuration
files have been removed. The retired hosted project remains private and has no
automatic deployment; this cleanup does not publish it or change its access.

**The repository is public, even though the website is private.** Do not commit
confidential drafts, private bookmarks, tokens, or personal exports. A draft
flag controls rendered output, not GitHub source visibility. Make the repo
private or use a separate private data source for confidential content.
