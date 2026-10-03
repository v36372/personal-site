#!/usr/bin/env bash
# Cloudflare Pages v3: Node 22.20.0 / Python 3.12; output directory dist/.
# This is an Access-protected draft preview, NOT a request to publish.
set -euo pipefail
python -m pip install uv==0.12.7
make test
