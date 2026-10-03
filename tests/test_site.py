"""Checks for generated HTML, navigation, feed, globe, and privacy defaults."""
import base64
import hashlib
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import unittest
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET
from scripts.build import SITE_URL, build, load_posts, tag_slug

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist'
ASSETS = ROOT / 'public'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.posts = load_posts(ROOT)
        cls.published = [post for post in cls.posts if not post.draft]
        cls.drafts = [post for post in cls.posts if post.draft]

    def test_pages_have_language_viewport_title_and_one_main_heading(self):
        pages = list(OUTPUT.rglob('*.html'))
        self.assertGreaterEqual(len(pages), 4)
        for path in pages:
            with self.subTest(page=str(path.relative_to(OUTPUT))):
                page = Page(path.read_text())
                self.assertTrue(any(tag == 'html' and attrs.get('lang') == 'en' for tag, attrs in page.tags))
                self.assertTrue(any(tag == 'title' for tag, _ in page.tags))
                self.assertTrue(any(tag == 'main' for tag, _ in page.tags))
                self.assertTrue(any(attrs.get('name') == 'viewport' for _, attrs in page.tags))
                self.assertEqual(sum(tag == 'h1' for tag, _ in page.tags), 1)
                self.assertTrue(any(tag == 'nav' and attrs.get('aria-label') == 'Main navigation'
                                    for tag, attrs in page.tags))

    def test_every_local_link_and_asset_exists(self):
        for path in OUTPUT.rglob('*.html'):
            page_url = '/' + str(path.relative_to(OUTPUT)).removesuffix('index.html')
            for _, attrs in Page(path.read_text()).tags:
                for key in ('href', 'src'):
                    value = attrs.get(key, '')
                    if not value or urlparse(value).scheme or value.startswith('#'):
                        continue
                    target_url = urlparse(urljoin(page_url, value))
                    target = OUTPUT / unquote(target_url.path).lstrip('/')
                    if target.is_dir():
                        target = target / 'index.html'
                    with self.subTest(page=str(path), link=value):
                        self.assertTrue(target.is_file(), target)

    def test_homepage_has_correct_canonical_and_honest_empty_state(self):
        text = (OUTPUT / 'index.html').read_text()
        self.assertIn(('link', {'rel': 'canonical', 'href': SITE_URL + '/'}), Page(text).tags)
        if not self.published:
            self.assertIn('No entries.', text)
        if self.drafts:
            self.assertIn('class="draft-label">Draft</span>', text)

    def test_shared_chrome_has_no_preview_badge_art_buttons_or_custom_favicon(self):
        for path in OUTPUT.rglob('*.html'):
            text = path.read_text()
            self.assertNotIn('preview-status', text)
            self.assertNotIn('Private preview', text)
            self.assertNotIn('Pause art', text)
            self.assertNotIn('Play art', text)
            self.assertNotIn('/favicon.svg', text)
            self.assertIn(('link', {'rel': 'icon', 'href': 'data:,'}), Page(text).tags)
        self.assertFalse((OUTPUT / 'favicon.svg').exists())

    def test_pages_content_build_excludes_drafts_and_all_wip_copy(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'site'
            build(ROOT, output=output)
            for post in self.drafts:
                self.assertFalse((output / post.url.lstrip('/')).exists())
            for path in output.rglob('*.html'):
                text = path.read_text()
                for phrase in ('Private preview', 'Pause art', 'Play art', 'layout preview',
                               'still taking shape', 'will appear', 'imported yet', 'shared yet',
                               'draft-label', 'draft-notice', 'waiting for its first post'):
                    with self.subTest(page=str(path.relative_to(output)), phrase=phrase):
                        self.assertNotIn(phrase, text)
            self.assertFalse((output / 'favicon.svg').exists())
            self.assertIn('make build', (ROOT / 'ops/pages-build.sh').read_text())

    def test_private_preview_is_noindex(self):
        for path in OUTPUT.rglob('*.html'):
            self.assertIn(('meta', {'name': 'robots', 'content': 'noindex, nofollow'}), Page(path.read_text()).tags)
        self.assertIn('Disallow: /', (OUTPUT / 'robots.txt').read_text())

    def test_drafts_are_not_in_feed_or_sitemap(self):
        items = ET.parse(OUTPUT / 'feed.xml').findall('.//item')
        self.assertEqual([item.findtext('title') for item in items], [post.title for post in self.published[:20]])
        sitemap = ET.parse(OUTPUT / 'sitemap.xml')
        urls = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        expected = ['/', '/about/', '/bookmarks/'] + [post.url for post in self.published]
        expected += ['/tags/' + tag_slug(tag) + '/' for tag in sorted({tag for post in self.published for tag in post.tags})]
        self.assertEqual(urls, [SITE_URL + path for path in expected])
        for post in self.drafts:
            self.assertNotIn(SITE_URL + post.url, urls)

    def test_globe_is_progressive_and_location_is_accessible(self):
        text = (OUTPUT / 'about/index.html').read_text()
        page = Page(text)
        self.assertIn(('script', {'type': 'module', 'src': '/globe.js'}), page.tags)
        self.assertTrue(any(tag == 'button' and attrs.get('id') == 'globe-motion'
                            and 'Ho Chi Minh City' in attrs.get('aria-label', '')
                            for tag, attrs in page.tags))
        self.assertIn('Ho Chi Minh City', text)
        self.assertIn('Vietnam', text)
        self.assertIn('prefers-reduced-motion', (ASSETS / 'globe.js').read_text())

    def test_globe_is_large_and_loaded_only_on_about(self):
        for path in OUTPUT.rglob('*.html'):
            text = path.read_text()
            header = text.split('<header class="site-header">', 1)[1].split('</header>', 1)[0]
            main = text.split('<main ', 1)[1].split('</main>', 1)[0]
            self.assertNotIn('id="globe"', header)
            self.assertIn('class="site-name"', header)
            self.assertIn('class="site-tagline"', header)
            if path == OUTPUT / 'about/index.html':
                self.assertEqual(text.count('id="globe"'), 1)
                self.assertIn('id="globe"', main)
                self.assertIn('src="/globe.js"', text)
                self.assertIn('class="about-globe"', main)
            else:
                self.assertNotIn('id="globe"', text)
                self.assertNotIn('src="/globe.js"', text)
        css = (ASSETS / 'site.css').read_text()
        self.assertIn('width: var(--globe-size); height: var(--globe-size);', css)
        self.assertIn('--globe-size: 240px;', css)
        self.assertIn('--globe-size: 200px;', css)

    def test_archive_is_removed_with_permanent_home_redirects(self):
        self.assertFalse((OUTPUT / 'archive').exists())
        for path in OUTPUT.rglob('*.html'):
            self.assertNotIn('href="/archive', path.read_text())
        self.assertNotIn('/archive/', (OUTPUT / 'sitemap.xml').read_text())
        self.assertEqual((OUTPUT / '_redirects').read_text(), '/archive / 301\n/archive/ / 301\n')

    def test_dither_art_frames_both_edges_without_covering_reading(self):
        for path in OUTPUT.rglob('*.html'):
            text = path.read_text()
            main = text.split('<main ', 1)[1].split('</main>', 1)[0]
            ids = [attrs['id'] for _, attrs in Page(text).tags if 'id' in attrs]
            self.assertEqual(len(ids), len(set(ids)), path)
            for position in ('header', 'footer'):
                self.assertEqual(text.count(f'id="art-{position}"'), 1)
                self.assertEqual(text.count(f'id="{position}-art-canvas"'), 1)
                self.assertNotIn(f'{position}-art-canvas', main)
                self.assertNotIn('class="art-motion"', text)
            self.assertLess(text.index('id="art-header"'), text.index('<div class="page">'))
            self.assertGreater(text.index('id="art-footer"'), text.index('</footer>'))
            self.assertIn('src="/header-art.js"', text)
        css = (ASSETS / 'site.css').read_text()
        self.assertIn('--art-height: 180px;', css)
        self.assertIn('--art-height: 120px;', css)
        self.assertIn('--art-fade-direction: to top;', css)
        self.assertIn('rgba(0,0,0,.03) 90%, transparent 100%', css)
        self.assertIn('height: var(--art-height)', css)
        self.assertIn("url('/header-art-fallback.svg')", css)
        ET.parse(ASSETS / 'header-art-fallback.svg')

    def test_capy_shader_provenance_and_licenses_are_preserved(self):
        shader = ASSETS / 'vendor/aura-capy-shaders.js'
        self.assertEqual(hashlib.sha256(shader.read_bytes()).hexdigest(),
                         'b5234201c71050590b29d6eb1c14a81f172dd4b0a661f0d7ace3fc91947c943e')
        self.assertIn('Apache License', (ASSETS / 'vendor/PAPER-SHADERS-APACHE-2.0.txt').read_text())
        self.assertIn('Copyright (c) 2026 Mateo Cerquetella', (ASSETS / 'vendor/aura-LICENSE.txt').read_text())
        self.assertIn('acaa0378891adb6fc4d6c643b4c939ecfb1997c2', (ASSETS / 'vendor/DITHER-NOTICES.txt').read_text())

    def test_cobe_is_pinned_and_license_is_included(self):
        self.assertEqual(hashlib.sha256((ASSETS / 'vendor/cobe-2.0.1.js').read_bytes()).hexdigest(),
                         'b4706c2a8772c5983f0872e02bbb707e551e093b32ad7c01d61dd661765097ee')
        self.assertIn('Copyright (c) 2021 Shu Ding', (ASSETS / 'vendor/cobe-LICENSE.txt').read_text())

    def test_csp_allows_cobe_without_unsafe_inline_or_eval(self):
        config = (ROOT / 'ops/nginx.conf').read_text()
        for style in (b'', b':root{}'):
            style_hash = base64.b64encode(hashlib.sha256(style).digest()).decode()
            self.assertIn("'sha256-" + style_hash + "'", config)
        self.assertIn("img-src 'self' data:", config)
        self.assertNotIn("'unsafe-inline'", config)
        self.assertNotIn("'unsafe-eval'", config)

    def test_pages_preserves_security_headers_and_pinned_vendor_caching(self):
        headers = (ASSETS / '_headers').read_text()
        nginx = (ROOT / 'ops/nginx.conf').read_text()
        policy = nginx.split('add_header Content-Security-Policy "', 1)[1].split('"', 1)[0]
        self.assertIn('Content-Security-Policy: ' + policy, headers)
        self.assertIn('X-Content-Type-Options: nosniff', headers)
        self.assertIn('X-Frame-Options: DENY', headers)
        self.assertIn('X-Robots-Tag: noindex, nofollow', headers)
        self.assertIn('/vendor/*\n  Cache-Control: public, max-age=31536000, immutable', headers)
        self.assertTrue((OUTPUT / '_headers').is_file())

    def test_output_contains_no_source_secrets_or_symlinks(self):
        for path in OUTPUT.rglob('*'):
            self.assertFalse(path.is_symlink())
            self.assertFalse(path.name.startswith('.'))
            self.assertNotEqual(path.suffix, '.md')
        self.assertFalse((OUTPUT / 'templates').exists())
        self.assertFalse((OUTPUT / 'content').exists())
        self.assertFalse((OUTPUT / 'README.md').exists())

    def test_nginx_only_exposes_generated_release(self):
        config = (ROOT / 'ops/nginx.conf').read_text()
        self.assertIn('listen 8000 default_server;', config)
        self.assertIn('root /srv/tinnguyen/current;', config)
        self.assertIn('autoindex off;', config)
        self.assertIn('try_files $uri $uri/ =404;', config)


if __name__ == '__main__':
    unittest.main()
