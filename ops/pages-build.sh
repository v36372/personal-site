#!/usr/bin/env bash
# Cloudflare Pages v3: Node 22.20.0 / Python 3.12; output directory dist/.
# Set SKIP_DEPENDENCY_INSTALL=true in Pages to avoid its implicit pip install .
# Access stays owner-only. Serve reviewed content, not the local draft preview.
set -euo pipefail
python -m pip install uv==0.12.7
# Python's module entrypoint works even when asdf has no shim for pip-installed uv.
make test UV='python -m uv'
# Tests use a local draft preview; do not upload that output to Pages.
make build UV='python -m uv'
