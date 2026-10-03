#!/usr/bin/env python3
"""Deploy via the attached exe integration, or via SSH with --ssh."""
import argparse
import base64
import io
import os
from pathlib import Path
import shlex
import subprocess
import tarfile
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
VM = "tinnguyen"
API = os.environ.get("EXE_API_URL", "https://exe.int.exe.xyz/exec")


def remote(script, use_ssh=False):
    script = "set -euo pipefail\n" + script
    if use_ssh:
        result = subprocess.run(
            ["ssh", VM + ".exe.xyz", "bash -s"],
            input=script, text=True, capture_output=True, timeout=45,
        )
        if result.returncode:
            raise RuntimeError(result.stdout + result.stderr)
        return result.stdout

    # /exec has a 30s timeout and reports remote exit codes in HTTP trailers.
    # Include a marker in stdout so failures cannot be mistaken for HTTP 200.
    marker = "__REMOTE_EXIT_" + uuid.uuid4().hex + "__="
    wrapper = (
        "bash -c " + shlex.quote(script)
        + "; rc=$?; printf '\n" + marker + "%s\n' \"$rc\"; exit \"$rc\""
    )
    body = ("ssh " + VM + " " + shlex.quote(wrapper)).encode()
    if len(body) > 64 * 1024:
        raise RuntimeError("Site exceeds the HTTPS API's 64KiB limit; use --ssh.")
    request = urllib.request.Request(API, data=body, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            output = response.read().decode()
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error
    result, separator, code = output.rpartition(marker)
    if not separator or code.strip() != "0":
        raise RuntimeError("Remote command failed:\n" + output)
    return result.rstrip() + "\n"


def bootstrap(use_ssh):
    work = "/tmp/tinnguyen-setup-" + uuid.uuid4().hex
    encoded = base64.b64encode((ROOT / "ops/bootstrap.sh").read_bytes()).decode()
    job = f"bash {work}/setup.sh > {work}/log 2>&1; printf '%s\n' \"$?\" > {work}/status"
    remote(f"""umask 077
mkdir -p {work}
printf '%s' '{encoded}' | base64 -d > {work}/setup.sh
setsid nohup bash -c {shlex.quote(job)} </dev/null >/dev/null 2>&1 &
""", use_ssh)
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        status = remote(
            f"if test -f {work}/status; then cat {work}/status; else echo pending; fi",
            use_ssh,
        ).strip()
        if status != "pending":
            print(remote(f"tail -n 30 {work}/log", use_ssh))
            if status != "0":
                raise RuntimeError(f"Bootstrap failed; logs: {work}/log")
            remote(f"rm -rf {work}", use_ssh)
            return
        time.sleep(2)
    raise RuntimeError(f"Bootstrap timed out; inspect {work}/log")


def deploy(use_ssh):
    buffer = io.BytesIO()
    public = ROOT / "public"
    with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
        for path in sorted(public.rglob("*")):
            if path.is_symlink():
                raise RuntimeError(f"Public directory must not contain symlinks: {path}")
            if path.is_file():
                archive.add(path, arcname=str(path.relative_to(public)))
    content = base64.b64encode(buffer.getvalue()).decode()
    config = base64.b64encode((ROOT / "ops/nginx.conf").read_bytes()).decode()
    release = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
    directory = "/srv/tinnguyen/releases/" + release
    print(remote(f"""mkdir -p {directory}
printf '%s' '{content}' | base64 -d | tar -xzf - --no-same-owner --no-same-permissions -C {directory}
find {directory} -type d -exec chmod 0755 {{}} +
find {directory} -type f -exec chmod 0644 {{}} +
printf '%s' '{config}' | base64 -d > /tmp/tinnguyen-nginx-{release}.conf
sudo install -m 0644 /tmp/tinnguyen-nginx-{release}.conf /etc/nginx/sites-available/tinnguyen
rm /tmp/tinnguyen-nginx-{release}.conf
sudo ln -sfn /etc/nginx/sites-available/tinnguyen /etc/nginx/sites-enabled/tinnguyen
sudo nginx -t
ln -sfn {directory} /srv/tinnguyen/.current-new
mv -Tf /srv/tinnguyen/.current-new /srv/tinnguyen/current
sudo systemctl enable --now nginx
sudo systemctl reload nginx
curl -fsS http://127.0.0.1:8000/ >/dev/null
printf 'Deployed release: {release}\n'
""", use_ssh))
    print("Site: https://tinnguyen.exe.xyz/")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--setup", action="store_true", help="Install nginx before deploying (first run).")
    parser.add_argument("--ssh", action="store_true", help="Use owner SSH access instead of the exe integration.")
    args = parser.parse_args()
    try:
        if args.setup:
            bootstrap(args.ssh)
        deploy(args.ssh)
    except (RuntimeError, OSError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
