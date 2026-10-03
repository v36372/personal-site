#!/usr/bin/env bash
# Cloudflare Pages v3: Node 22.20.0 / Python 3.12; output directory dist/.
# Set SKIP_DEPENDENCY_INSTALL=true in Pages to avoid its implicit pip install .
# This is an Access-protected draft preview, NOT a request to publish.
set -euo pipefail
python -m pip install uv==0.12.7
# Python's module entrypoint works even when asdf has no shim for pip-installed uv.
make test UV='python -m uv'
