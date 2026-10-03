#!/usr/bin/env python3
"""Rebuild the committed main branch on private Cloudflare Pages (no local upload)."""
import argparse
import json
import os
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse
import uuid

API = os.environ.get('CLOUDFLARE_API_URL', 'https://cloudflare.int.exe.xyz/client/v4').rstrip('/')
ACCOUNT = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '700a6c6ad6178d92f1abcf67630f3a95')
PROJECT = 'tinnguyen'
HOST = 'tinnguyen.pages.dev'
APP = '1add1fd3-ef6b-4897-ac60-390c5b60440b'
PROJECT_PATH = f'accounts/{ACCOUNT}/pages/projects/{PROJECT}'


def api(path, method='GET', body=None):
    headers = {'Content-Type': 'application/json'}
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(API + '/' + path, method=method, headers=headers,
                                     data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            data = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Cloudflare HTTP {error.code}: {error.read().decode()}') from error
    if not data.get('success'):
        raise RuntimeError(f"Cloudflare rejected request: {data.get('errors')}")
    return data['result']


def owner_email():
    supplied = os.environ.get('CLOUDFLARE_ACCESS_EMAIL')
    if supplied:
        return supplied.strip().lower()
    with urllib.request.urlopen('https://reflection.int.exe.xyz/email', timeout=15) as response:
        return json.load(response)['email'].lower()


def validate_access(app, owner):
    domains = set(app.get('self_hosted_domains', [app.get('domain')]))
    if app.get('type') != 'self_hosted' or not {HOST, '*.' + HOST}.issubset(domains):
        raise RuntimeError('Access must protect BOTH the main Pages host and every deployment subdomain.')
    policies = app.get('policies', [])
    if not policies:
        raise RuntimeError('No owner-only Access policy found.')
    for policy in policies:
        includes = policy.get('include', [])
        if (policy.get('decision') != 'allow' or not includes
                or any(set(rule) != {'email'} or rule['email'].get('email', '').lower() != owner
                       for rule in includes)):
            raise RuntimeError('Access is not owner-only. Deployment refused; no access settings were changed.')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check_login(host):
    opener = urllib.request.build_opener(NoRedirect())
    # Pages' bot protection rejects urllib's default agent before Access runs.
    request = urllib.request.Request('https://' + host + '/',
                                     headers={'User-Agent': 'personal-site-deploy/1.0'})
    try:
        with opener.open(request, timeout=20) as response:
            status, headers = response.status, response.headers
    except urllib.error.HTTPError as error:
        status, headers = error.code, error.headers
        error.close()
    location = urlparse(headers.get('Location', ''))
    if (status not in (302, 303, 307, 308) or location.scheme != 'https'
            or not (location.hostname or '').endswith('.cloudflareaccess.com')
            or not location.path.startswith('/cdn-cgi/access/login/')):
        raise RuntimeError(f'Anonymous requests to {host} are not blocked by Access. Deployment refused.')


def ensure_private():
    validate_access(api(f'accounts/{ACCOUNT}/access/apps/{APP}'), owner_email())
    check_login(HOST)
    check_login('privacy-check-' + uuid.uuid4().hex[:8] + '.' + HOST)


def deploy(wait=True):
    ensure_private()
    project = api(PROJECT_PATH)
    source = project.get('source', {})
    if (source.get('type') != 'github'
            or source.get('config', {}).get('owner') != 'v36372'
            or source.get('config', {}).get('repo_name') != 'personal-site'
            or project.get('production_branch') != 'main'):
        raise RuntimeError('Unexpected Pages source; refusing to rebuild a different repository/branch.')
    result = api(PROJECT_PATH + '/deployments', method='POST', body={})
    deployment_id = result['id']
    print(f'Cloudflare build queued: {deployment_id}', flush=True)
    print('Builds committed GitHub main, not uncommitted local files.', flush=True)
    if not wait:
        return result
    deadline = time.monotonic() + 600
    previous = None
    while time.monotonic() < deadline:
        result = api(PROJECT_PATH + '/deployments/' + deployment_id)
        stage = result.get('latest_stage', {})
        current = (stage.get('name'), stage.get('status'))
        if current != previous:
            print(' / '.join(str(value) for value in current), flush=True)
            previous = current
        if stage.get('status') in ('failure', 'canceled'):
            raise RuntimeError(f'Pages build {deployment_id} failed. Inspect the Cloudflare build log.')
        if current == ('deploy', 'success'):
            ensure_private()
            print('Site: https://' + HOST + '/', flush=True)
            return result
        time.sleep(5)
    raise RuntimeError(f'Pages build timed out; inspect deployment {deployment_id}.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--no-wait', action='store_true', help='Queue the build and exit.')
    parser.add_argument('--check', action='store_true', help='Verify Access without creating a deployment.')
    args = parser.parse_args()
    try:
        if args.check:
            ensure_private()
            print('Owner-only Access verified for main and deployment hosts.')
        else:
            deploy(wait=not args.no_wait)
    except (RuntimeError, OSError, ValueError, KeyError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
