# Personal website

- Working source: /home/exedev/codes/tinnguyen on the BB VM.
- Deployment VM: tinnguyen.exe.xyz, image ghcr.io/ryanlewis/exeslim:latest.
- This is an original Markdown blog: edit content/posts/ for writing, templates/
  for layouts, and public/ for assets. dist/ is generated; never edit it.
- Run make dev for local auto-rebuilding previews, make test for checks, and
  make deploy to upload a private preview. Python dependencies use uv.lock.
- Drafts default to true, are visibly labeled, and are excluded from RSS and
  sitemap. make build excludes drafts; make preview includes them.
- Current design inspiration: ludwigabap.com (compact warm monospace UI and
  bookmarks browsing). Layout CSS and templates are original; licensed shader
  and renderer adaptations have provenance in public/vendor/DITHER-NOTICES.txt.
- Tin chose 'Set up tab first': content/bookmarks.json is intentionally empty.
  Do not fabricate bookmarks or fetch private collections without a supplied
  source/authorization. Private preview shows all entries; published builds
  show only bookmarks explicitly marked publish=true.
- Lucumr is design inspiration only. Its repository is not open source; do not
  copy its code, templates, assets, fonts, or posts.
- The exe integration at https://exe.int.exe.xyz/exec provides owner-authenticated
  API access from this BB VM. Do not request or write API tokens into the repo.
- Keep the website PRIVATE while Tin is editing. Do not enable public access
  or create share links unless Tin explicitly asks to publish/share it.
  Deployments must preserve the existing private visibility.
- Only /srv/tinnguyen/current on nginx port 8000 is served through the HTTPS
  proxy. Do not serve the source root or expose admin/dev servers publicly.
- Confirmed location: Ho Chi Minh City, Vietnam (10.8231, 106.6297). The
  globe uses self-hosted COBE 2.0.1. Keep it ONLY in the shared header, beside
  the site name, exactly one text line high (1lh). No content-area globe or
  large pin label. See README.md for CSP, motion, and fallback details.
- Capy-style animated dither art is ONLY a top-of-page strip: 150px desktop /
  100px mobile, not a full-page/chat wallpaper. Preserve the pause control,
  reduced-motion/static fallback, theme matching, and bounded 15fps rendering.
  Shader sources are pinned from Aura; retain MIT/Apache notices when editing.
- Do not invent personal biography, social links, projects, or contact details.
- exeslim is a deployment target without a development toolchain. Develop here.
