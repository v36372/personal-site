from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class VMUpdateTests(unittest.TestCase):
    def test_only_pinned_main_is_fetched_and_checked_before_deployment(self):
        script = (ROOT / 'ops/vm-update.sh').read_text()
        self.assertIn('git fetch --quiet --no-tags https://github.com/v36372/personal-site.git refs/heads/main', script)
        self.assertNotIn('refs/pull', script)
        self.assertIn('flock -n 9', script)
        self.assertIn('personal-site-status.int.exe.xyz/exec', script)
        self.assertLess(script.index('--check'), script.index('make test'))
        self.assertLess(script.index('make test'), script.index('make build'))
        self.assertLess(script.index('make build'), script.index('--local'))
        self.assertLess(script.index('--local'), script.index('mv -f'))

    def test_one_website_vm_and_no_self_hosted_runner(self):
        service = (ROOT / 'ops/tinnguyen-update.service').read_text()
        timer = (ROOT / 'ops/tinnguyen-update.timer').read_text()
        self.assertIn('User=exedev', service)
        self.assertIn('OnUnitInactiveSec=60s', timer)
        self.assertFalse((ROOT / 'ops/runner-bootstrap.sh').exists())
        workflow = (ROOT / '.github/workflows/deploy.yml').read_text()
        self.assertIn('runs-on: ubuntu-24.04', workflow)
        self.assertNotIn('runs-on: [self-hosted', workflow)
        self.assertNotIn('${{ secrets.', workflow)
        makefile = (ROOT / 'Makefile').read_text()
        self.assertIn('deploy: test\n\t$(MAKE) build\n\tpython3 scripts/deploy.py', makefile)

    def test_nginx_preserves_redirects_privacy_and_security_with_vendor_cache(self):
        config = (ROOT / 'ops/nginx.conf').read_text()
        self.assertIn('absolute_redirect off;', config)
        self.assertIn('location = /archive { return 301 /; }', config)
        self.assertIn('location = /archive/ { return 301 /; }', config)
        self.assertIn('server_name tinng.exe.xyz;', config)
        self.assertIn('location = /bookmarks { return 301 /reading/$is_args$args; }', config)
        self.assertIn('location = /bookmarks/ { return 301 /reading/$is_args$args; }', config)
        self.assertIn('gzip on;', config)
        self.assertIn('add_header X-Robots-Tag "noindex, nofollow" always;', config)
        self.assertIn('location /vendor/ { expires 365d; }', config)
        # expires does not override the inherited CSP/other add_header directives.
        self.assertNotIn('location /vendor/ { add_header', config)


if __name__ == '__main__':
    unittest.main()
