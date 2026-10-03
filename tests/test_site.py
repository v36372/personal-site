"""Dependency-free checks for the static site and deployment configuration."""
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class SiteTests(unittest.TestCase):
    def test_pages_have_language_viewport_title_and_main(self):
        for path in PUBLIC.glob("*.html"):
            with self.subTest(page=path.name):
                page = Page(path.read_text())
                self.assertIn(("html", {"lang": "en"}), page.tags)
                self.assertTrue(any(tag == "title" for tag, _ in page.tags))
                self.assertTrue(any(tag == "main" for tag, _ in page.tags))
                self.assertTrue(any(attrs.get("name") == "viewport" for _, attrs in page.tags))
                self.assertEqual(sum(tag == "h1" for tag, _ in page.tags), 1)

    def test_local_assets_and_links_exist(self):
        for path in PUBLIC.glob("*.html"):
            for tag, attrs in Page(path.read_text()).tags:
                for key in ("href", "src"):
                    value = attrs.get(key, "")
                    if not value or urlparse(value).scheme or value.startswith("#"):
                        continue
                    target = PUBLIC / value.lstrip("/")
                    if target.is_dir():
                        target = target / "index.html"
                    with self.subTest(page=path.name, link=value):
                        self.assertTrue(target.is_file())

    def test_homepage_has_correct_canonical(self):
        self.assertIn(
            ("link", {"rel": "canonical", "href": "https://tinnguyen.exe.xyz/"}),
            Page((PUBLIC / "index.html").read_text()).tags,
        )

    def test_sitemap_has_correct_hostname(self):
        tree = ET.parse(PUBLIC / "sitemap.xml")
        urls = tree.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
        self.assertEqual([url.text for url in urls], ["https://tinnguyen.exe.xyz/"])

    def test_404_is_not_indexed(self):
        self.assertIn(
            ("meta", {"name": "robots", "content": "noindex"}),
            Page((PUBLIC / "404.html").read_text()).tags,
        )

    def test_no_symlinks_or_secrets_in_public_directory(self):
        for path in PUBLIC.rglob("*"):
            self.assertFalse(path.is_symlink())
            self.assertFalse(path.name.startswith("."))

    def test_nginx_only_exposes_public_release(self):
        config = (ROOT / "ops/nginx.conf").read_text()
        self.assertIn("listen 8000 default_server;", config)
        self.assertIn("root /srv/tinnguyen/current;", config)
        self.assertIn("autoindex off;", config)
        self.assertIn("try_files $uri $uri/ =404;", config)
        self.assertIn("Content-Security-Policy", config)


if __name__ == "__main__":
    unittest.main()
