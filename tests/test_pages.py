"""Private Pages deploys must protect stable and immutable deployment URLs."""
import copy
from email.message import Message
import unittest
from unittest.mock import patch
import urllib.error
from scripts import deploy_pages


class PagesPrivacyTests(unittest.TestCase):
    def setUp(self):
        self.app = {'type': 'self_hosted',
                    'self_hosted_domains': [deploy_pages.HOST, '*.' + deploy_pages.HOST],
                    'policies': [{'decision': 'allow', 'include': [
                        {'email': {'email': 'owner@example.com'}}]}]}

    def test_owner_only_root_and_wildcard_access_is_allowed(self):
        before = copy.deepcopy(self.app)
        deploy_pages.validate_access(self.app, 'owner@example.com')
        self.assertEqual(self.app, before)

    def test_root_only_or_preview_only_protection_is_refused(self):
        for domains in ([deploy_pages.HOST], ['*.' + deploy_pages.HOST], []):
            self.app['self_hosted_domains'] = domains
            with self.subTest(domains=domains), self.assertRaises(RuntimeError):
                deploy_pages.validate_access(self.app, 'owner@example.com')

    def test_missing_policies_wrong_owner_and_bypasses_are_refused(self):
        for policies in ([], [{'decision': 'allow', 'include': []}],
                         [{'decision': 'bypass', 'include': [{'everyone': {}}]}],
                         [{'decision': 'allow', 'include': [{'everyone': {}}]}],
                         [{'decision': 'allow', 'include': [{'email': {'email': 'other@example.com'}}]}],
                         self.app['policies'] + [{'decision': 'bypass', 'include': [{'everyone': {}}]}]):
            self.app['policies'] = policies
            with self.subTest(policies=policies), self.assertRaises(RuntimeError):
                deploy_pages.validate_access(self.app, 'owner@example.com')

    def test_access_login_redirect_is_required_not_merely_a_404(self):
        for code, location in [(302, 'https://team.cloudflareaccess.com/cdn-cgi/access/login/' + deploy_pages.HOST),
                               (404, ''), (302, 'https://example.com/login'),
                               (302, 'http://team.cloudflareaccess.com/cdn-cgi/access/login/site')]:
            headers = Message()
            headers['Location'] = location
            error = urllib.error.HTTPError('https://' + deploy_pages.HOST, code, '', headers, None)
            with patch.object(deploy_pages.urllib.request, 'build_opener') as opener:
                opener.return_value.open.side_effect = error
                if code == 302 and location.startswith('https://team.cloudflareaccess.com/'):
                    deploy_pages.check_login(deploy_pages.HOST)
                else:
                    with self.assertRaises(RuntimeError):
                        deploy_pages.check_login(deploy_pages.HOST)

    def test_failed_privacy_check_never_triggers_a_build(self):
        with patch.object(deploy_pages, 'ensure_private', side_effect=RuntimeError('not private')), \
                patch.object(deploy_pages, 'api') as api:
            with self.assertRaises(RuntimeError):
                deploy_pages.deploy(wait=False)
            api.assert_not_called()


if __name__ == '__main__':
    unittest.main()
