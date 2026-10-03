import json
from pathlib import Path
import shutil
import tempfile
import unittest
from scripts.bookmarks import load_bookmarks, parse_bookmark
from scripts.build import ROOT, build


class BookmarkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'site'
        self.root.mkdir()
        shutil.copytree(ROOT / 'templates', self.root / 'templates')
        shutil.copytree(ROOT / 'public', self.root / 'public')
        (self.root / 'content').mkdir()
        self.source = self.root / 'content/bookmarks.json'

    def save(self, items):
        self.source.write_text(json.dumps(items))

    def test_bookmarks_are_private_and_undated_by_default(self):
        item = parse_bookmark({'url': 'https://example.test/reading'})
        self.assertFalse(item.publish)
        self.assertIsNone(item.saved)
        self.assertEqual(item.month, 'undated')
        self.assertEqual(item.month_label, 'Date not recorded')
        self.assertEqual(item.domain, 'example.test')
        self.assertEqual(item.title, item.url)

    def test_unsafe_links_and_credentials_are_rejected(self):
        for url in ['javascript:alert(1)', 'data:text/html,bad', 'ftp://example.test/file',
                    'https://owner:secret@example.test/', 'https://example.test/a\nb',
                    'https://example.test:bad/']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                parse_bookmark({'url': url})

    def test_invalid_metadata_is_rejected(self):
        for fields in [{'kind': 'unknown'}, {'kind': []}, {'saved': '20261003'},
                       {'saved': '2026-02-31'}, {'publish': 'false'}, {'tags': 'tag'},
                       {'tags': ['']}, {'note': []}]:
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                parse_bookmark({'url': 'https://example.test/'} | fields)

    def test_all_entries_are_rendered_without_a_latest_limit(self):
        self.save([{'title': f'Reading {index}', 'url': f'https://example.test/{index}',
                    'saved': '2026-01-02'} for index in range(501)])
        build(self.root, include_drafts=True)
        page = (self.root / 'dist/reading/index.html').read_text()
        self.assertEqual(page.count('class="bookmark-row"'), 501)
        self.assertIn('Reading 500', page)
        self.assertIn('501 saved links', page)
        self.assertFalse((self.root / 'dist/content/bookmarks.json').exists())

    def test_public_build_requires_explicit_bookmark_review(self):
        self.save([{'title': 'Private link', 'url': 'https://example.test/private'},
                   {'title': 'Reviewed link', 'url': 'https://example.test/reviewed', 'publish': True}])
        build(self.root)
        text = (self.root / 'dist/reading/index.html').read_text()
        self.assertIn('Reviewed link', text)
        self.assertNotIn('Private link', text)
        build(self.root, include_drafts=True)
        text = (self.root / 'dist/reading/index.html').read_text()
        self.assertIn('Private link', text)
        self.assertIn('Reviewed link', text)

    def test_sorting_timeline_and_tags(self):
        self.save([{'url': 'https://example.test/old', 'saved': '2024-01-01'},
                   {'url': 'https://example.test/unknown'},
                   {'url': 'https://example.test/new', 'saved': '2026-10-03',
                    'tags': ['Reading', 'Reading']}])
        entries = load_bookmarks(self.root)
        self.assertEqual([item.url.rsplit('/', 1)[-1] for item in entries], ['new', 'old', 'unknown'])
        self.assertEqual(entries[0].tags, ('Reading',))
        build(self.root, include_drafts=True)
        text = (self.root / 'dist/reading/index.html').read_text()
        self.assertIn('October 2026', text)
        self.assertIn('Date not recorded', text)
        self.assertIn('value="Reading"', text)

    def test_bookmark_text_is_escaped_not_executed(self):
        self.save([{'title': '<script>alert(1)</script>', 'url': 'https://example.test/',
                    'note': '<img src=x onerror=alert(1)>', 'tags': ["Reader's notes"]}])
        build(self.root, include_drafts=True)
        text = (self.root / 'dist/reading/index.html').read_text()
        self.assertNotIn('<script>alert(1)</script>', text)
        self.assertNotIn('<img src=x', text)
        self.assertIn('&lt;script&gt;', text)
        self.assertIn('Reader', text)

    def test_duplicate_urls_and_bad_source_fail_explicitly(self):
        self.save([{'url': 'https://example.test/'}, {'url': 'https://example.test/'}])
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            load_bookmarks(self.root)
        self.source.write_text('{}')
        with self.assertRaises(ValueError):
            load_bookmarks(self.root)
        self.source.unlink()
        self.source.symlink_to(ROOT / 'content/bookmarks.json')
        with self.assertRaises(ValueError):
            load_bookmarks(self.root)


if __name__ == '__main__':
    unittest.main()
