import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch
from scripts.deploy import deploy, ensure_private, remote


class DeploymentPrivacyTests(unittest.TestCase):
    def response(self, status):
        return io.BytesIO(json.dumps({'status': status}).encode())

    @patch('scripts.deploy.urllib.request.urlopen')
    def test_private_deployment_is_allowed_without_changing_access(self, urlopen):
        urlopen.return_value = self.response('private')
        ensure_private(False)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.data, b'share show tinng')

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

    @patch('scripts.deploy.subprocess.run')
    def test_local_deployment_uses_no_ssh_or_management_api(self, run):
        run.return_value = types.SimpleNamespace(returncode=0, stdout='local output', stderr='')
        self.assertEqual(remote('echo local', local=True), 'local output')
        self.assertEqual(run.call_args.args[0], ['bash', '-s'])
        self.assertTrue(run.call_args.kwargs['input'].startswith('set -euo pipefail'))

    @patch('scripts.deploy.urllib.request.urlopen')
    @patch('scripts.deploy.ensure_private')
    @patch('scripts.deploy.remote')
    def test_local_deployment_refuses_the_duplicate_or_renamed_vm(self, upload, private, urlopen):
        urlopen.return_value = io.BytesIO(b'{"name":"not-tinng"}')
        with self.assertRaisesRegex(RuntimeError, 'Local deployment refused'):
            deploy(False, local=True)
        private.assert_not_called()
        upload.assert_not_called()

    @patch('scripts.deploy.ensure_private')
    @patch('scripts.deploy.remote')
    def test_preview_artifacts_are_never_uploaded(self, upload, private):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'dist').mkdir()
            (root / 'dist/index.html').write_text('draft preview')
            (root / 'dist/robots.txt').write_text('User-agent: *\nDisallow: /\n')
            with patch('scripts.deploy.ROOT', root):
                with self.assertRaisesRegex(RuntimeError, 'Draft preview deployment refused'):
                    deploy(False)
        upload.assert_not_called()


if __name__ == '__main__':
    unittest.main()
