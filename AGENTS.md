# Personal website

- Working source: /home/exedev/codes/tinnguyen on the BB VM.
- Repository: v36372/personal-site (public). Do not commit private exports,
  confidential drafts/bookmarks, credentials, or runner state. Website-private
  visibility does NOT hide the GitHub source.
- Hosting: ONE private exeslim VM, tinng.exe.xyz, nginx on port 8000.
  The user renamed the original VM to tinng. Deploy target is tinng, NOT the
  former name. If a target is missing, inspect exe ls/rename state before
  creating anything; NEVER recreate an old hostname after a user rename.
  Internal /srv/tinnguyen paths and tinnguyen-update units retain their names.
  tinnguyen-ci has been DELETED; its deploy integration/key revoked. Do not
  recreate a CI VM or register a runner on the website/BB VM.
- GitHub Actions checks PRs/main on hosted runners. The website VM polls ONLY
  v36372/personal-site main every minute via tinnguyen-update.timer, runs all
  tests then a reviewed-content build, and atomically swaps nginx releases.
  Never fetch/run PR or fork code on the website or BB VM.
- No Cloudflare deployment code/config/helpers remain in this repository.
  The retired hosted project is still private; do not alter its protection
  or reactivate another hosting pipeline without the user asking.
- This is an original Markdown blog: edit content/posts/ for writing, templates/
  for layouts, and public/ for assets. dist/ is generated; never edit it.
- Run make dev for local previews, make test for checks, and git push origin
  main for automatic VM updates. make deploy tests then rebuilds reviewed
  content and uploads local dist/ via the owner exe integration. make setup-vm
  also bootstraps nginx/tooling. Dependencies use uv.lock; see README.md.
- Drafts default to true and stay out of RSS/sitemap. make preview labels them
  for LOCAL review only. Deployments MUST run make build AFTER make test;
  never upload the tests' draft preview or relabel specimen content as finished.
- No visible work-in-progress chrome: no favicon, Private preview badge,
  art buttons, placeholder/future-tense empty states, or unfinished About copy.
  Removing that chrome is NOT permission to make the website public.
- Current design inspiration: ludwigabap.com (compact warm monospace UI and
  bookmarks browsing). Layout CSS and templates are original; licensed shader
  and renderer adaptations have provenance in public/vendor/DITHER-NOTICES.txt.
- Navigation is Reading (/reading/), Writing (/), About (/about/), in that
  order. /bookmarks and /bookmarks/ redirect to /reading/ preserving queries.
  Reading retains content/bookmarks.json and the existing filter/data schema.
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
- nginx serves ONLY /srv/tinnguyen/current, generated HTML/assets, on port 8000
  behind exe.dev owner-only authentication. No source root, exports, dev servers
  or updater HTTP endpoints. Preserve CSP, noindex, relative redirects, gzip
  and pinned-vendor caching. Never change private sharing while deploying.
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
- Confirmed profiles: GitHub https://github.com/v36372 and X
  https://x.com/v36372, linked in About and footer. Do not invent any other
  biography, profiles, projects or contact details.
- Develop here. Auto-updates build on the website VM, not on a second CI VM.
  Its personal-site-status integration allows ONLY read-only share inspection;
  no management, shell, GitHub or deployment token is needed there. Credentials
  stay vaulted; never commit/log tokens. Renew its 1-year key before expiry.
