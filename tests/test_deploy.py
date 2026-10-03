import io
import json
import unittest
from unittest.mock import patch
from scripts.deploy import ensure_private


class DeploymentPrivacyTests(unittest.TestCase):
    def response(self, status):
        return io.BytesIO(json.dumps({'status': status}).encode())

    @patch('scripts.deploy.urllib.request.urlopen')
    def test_private_deployment_is_allowed_without_changing_access(self, urlopen):
        urlopen.return_value = self.response('private')
        ensure_private(False)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.data, b'share show tinnguyen')

    @patch('scripts.deploy.urllib.request.urlopen')
    def test_public_deployment_is_refused(self, urlopen):
        urlopen.return_value = self.response('public')
        with self.assertRaisesRegex(RuntimeError, 'Deployment refused'):
            ensure_private(False)

    @patch('scripts.deploy.urllib.request.urlopen')
    def test_missing_access_status_is_not_assumed_private(self, urlopen):
        urlopen.return_value = io.BytesIO(b'{}')
        with self.assertRaises(RuntimeError):
            ensure_private(False)


if __name__ == '__main__':
    unittest.main()
