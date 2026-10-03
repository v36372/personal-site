# Personal website

- Working source: /home/exedev/codes/tinnguyen on the BB VM.
- Repository: v36372/personal-site (public). Do not commit private exports,
  confidential drafts/bookmarks, credentials, or runner state. Website-private
  visibility does NOT hide the GitHub source.
- Hosting: private Cloudflare Pages at tinnguyen.pages.dev. Native GitHub
  integration builds main with bash ops/pages-build.sh, output dist/.
  Branch/PR previews are disabled. GitHub Actions runs checks on hosted runners.
- Access app 1add1fd3-ef6b-4897-ac60-390c5b60440b protects BOTH
  tinnguyen.pages.dev and *.tinnguyen.pages.dev with owner-only Google login.
  Keep it enabled; all generated production deployment URLs must stay private.
- Legacy tinnguyen.exe.xyz is a private rollback copy. The tinnguyen-ci runner
  is stopped, not deleted. Never execute untrusted PR code on that VM.
- This is an original Markdown blog: edit content/posts/ for writing, templates/
  for layouts, and public/ for assets. dist/ is generated; never edit it.
- Run make dev for local auto-rebuilding previews, make test for checks, and
  git push origin main for Pages auto-deployment. make deploy verifies Access
  and rebuilds committed GitHub main, not local changes. See README.md.
  Python dependencies use uv.lock.
- Drafts default to true and stay out of RSS/sitemap. make preview labels them
  for LOCAL review only. Pages runs make test then make build, serving only
  reviewed posts/bookmarks; never publish sample drafts to hide their labels.
- No visible work-in-progress chrome: no favicon, Private preview badge,
  art buttons, placeholder/future-tense empty states, or unfinished About copy.
  Removing that chrome is NOT permission to make the website public.
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
- Pages serves generated dist/ only; public/_headers preserves the CSP.
  Do not expose the source root or admin/dev servers. The legacy VM serves only
  /srv/tinnguyen/current on nginx port 8000 through its private HTTPS proxy.
- No Archive page, navigation, or sitemap entry. /archive and /archive/
  redirect permanently to /. The writing index lists ALL published posts.
- Confirmed location: Ho Chi Minh City, Vietnam (10.8231, 106.6297). The
  self-hosted COBE 2.0.1 globe lives ONLY in the About content: 240px desktop,
  200px mobile, alongside the introduction / stacked on narrow screens.
  Never load COBE or globe.js on other pages, or put a globe in the header.
  Keep city marker, accessible pause/play, reduced motion, and fallbacks.
- Capy-style animated dither art is ONLY in top/bottom bands: each 180px desktop /
  120px mobile, with a long eased fade toward the body, never behind reading.
  No visible art controls. The About globe pauses/plays ALL animations, with
  session-local preference. Preserve reduced-motion/static fallback, theme matching,
  lazy offscreen initialization, and bounded 15fps rendering at 0.35x speed.
  Shader sources are pinned from Aura; retain MIT/Apache notices when editing.
- Do not invent personal biography, social links, projects, or contact details.
- Develop here; no exe.dev VM is needed to build or serve the Pages deployment.
  Account/project IDs are configuration, not secrets. API credentials are
  vault-backed via cloudflare.int.exe.xyz; never commit or log tokens.
