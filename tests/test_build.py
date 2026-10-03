from pathlib import Path
import shutil
import tempfile
import unittest
import xml.etree.ElementTree as ET
from scripts.build import ROOT, SITE_URL, build, load_post, load_posts


def post_text(title='Test entry', published='2024-01-02', slug='test-entry', draft='false', tags='["Notes"]', body='Hello **world**.'):
    return f'+++\ntitle = "{title}"\ndate = {published}\nslug = "{slug}"\ntags = {tags}\n' + (f'draft = {draft}\n' if draft is not None else '') + f'+++\n\n{body}\n'


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'site'
        self.root.mkdir()
        shutil.copytree(ROOT / 'templates', self.root / 'templates')
        shutil.copytree(ROOT / 'public', self.root / 'public')
        (self.root / 'content/posts').mkdir(parents=True)
        self.output = self.root / 'dist'

    def add_post(self, name, **kwargs):
        path = self.root / 'content/posts' / (name + '.md')
        path.write_text(post_text(**kwargs))
        return path

    def test_missing_draft_flag_is_safe_by_default(self):
        path = self.add_post('draft', draft=None)
        self.assertTrue(load_post(path).draft)

    def test_published_build_excludes_drafts_and_future_entries(self):
        self.add_post('published')
        self.add_post('draft', slug='draft-entry', draft='true', tags='["Private topic"]')
        self.add_post('future', slug='future-entry', published='2999-01-01')
        posts = build(self.root)
        self.assertEqual([post.slug for post in posts], ['test-entry'])
        self.assertFalse((self.output / '2024/01/02/draft-entry').exists())
        self.assertFalse((self.output / 'tags/private-topic').exists())
        self.assertNotIn('Private preview', (self.output / 'index.html').read_text())
        self.assertIn('Allow: /', (self.output / 'robots.txt').read_text())
        items = ET.parse(self.output / 'feed.xml').findall('.//item')
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].findtext('link'), SITE_URL + '/2024/01/02/test-entry/')

    def test_preview_drafts_are_not_syndicated(self):
        self.add_post('published', title='Published & tested')
        self.add_post('draft', title='Private draft', slug='draft-entry', draft='true', tags='["Private topic"]')
        posts = build(self.root, include_drafts=True)
        self.assertEqual(len(posts), 2)
        self.assertTrue((self.output / '2024/01/02/draft-entry/index.html').is_file())
        self.assertIn('noindex, nofollow', (self.output / '2024/01/02/draft-entry/index.html').read_text())
        feed = ET.parse(self.output / 'feed.xml')
        self.assertEqual([item.findtext('title') for item in feed.findall('.//item')], ['Published & tested'])
        self.assertNotIn('draft-entry', (self.output / 'sitemap.xml').read_text())
        self.assertNotIn('private-topic', (self.output / 'sitemap.xml').read_text())

    def test_posts_sort_newest_first_and_generate_navigation(self):
        self.add_post('older', slug='older-entry', published='2023-01-01')
        self.add_post('newer', slug='newer-entry', published='2024-01-02')
        posts = build(self.root)
        self.assertEqual([post.slug for post in posts], ['newer-entry', 'older-entry'])
        newer = (self.output / '2024/01/02/newer-entry/index.html').read_text()
        self.assertIn('/2023/01/01/older-entry/', newer)
        self.assertIn('Older entry', newer)

    def test_invalid_metadata_keeps_last_successful_build(self):
        path = self.add_post('published')
        build(self.root)
        previous = (self.output / 'index.html').read_bytes()
        path.write_text('not valid front matter')
        with self.assertRaises(ValueError):
            build(self.root)
        self.assertEqual((self.output / 'index.html').read_bytes(), previous)

    def test_duplicate_urls_and_colliding_tags_are_rejected(self):
        self.add_post('one')
        self.add_post('two')
        with self.assertRaisesRegex(ValueError, 'Duplicate post URL'):
            load_posts(self.root)
        self.add_post('two', slug='second-entry', tags='["notes"]')
        with self.assertRaisesRegex(ValueError, 'same URL'):
            load_posts(self.root)

    def test_front_matter_cannot_escape_output_or_mistype_draft(self):
        path = self.add_post('one', slug='../outside')
        with self.assertRaises(ValueError):
            load_post(path)
        path.write_text(post_text(draft='"false"'))
        with self.assertRaises(ValueError):
            load_post(path)

    def test_markdown_html_is_escaped_and_formatting_works(self):
        path = self.add_post('one', body='<script>alert(1)</script>\n\n**Bold** and `code`.\n\n~~~python\nprint("hi")\n~~~')
        post = load_post(path)
        self.assertNotIn('<script>', post.html)
        self.assertIn('&lt;script&gt;', post.html)
        self.assertIn('<strong>Bold</strong>', post.html)
        self.assertIn('<code>code</code>', post.html)
        self.assertIn('language-python', post.html)

    def test_output_cannot_replace_source_and_assets_cannot_be_symlinks(self):
        with self.assertRaises(ValueError):
            build(self.root, output=self.root / 'public')
        (self.root / 'public/leak.txt').symlink_to(self.root / 'templates/base.html')
        with self.assertRaises(ValueError):
            build(self.root)


if __name__ == '__main__':
    unittest.main()
