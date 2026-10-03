#!/usr/bin/env bash
# Single exeslim website VM: nginx plus tools for trusted-main updates. No runner.
set -euo pipefail
sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nginx-light git python3 python3-venv make curl ca-certificates xz-utils tar
sudo install -d -m 0755 -o exedev -g exedev /srv/tinnguyen /srv/tinnguyen/releases
sudo rm -f /etc/nginx/sites-enabled/default

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# Pin and verify Node for module-aware JavaScript tests.
NODE_VERSION=24.20.0
NODE_SHA256=2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2
curl -fsSL --retry 3 "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" -o "$work/node.tar.xz"
printf '%s  %s\n' "$NODE_SHA256" "$work/node.tar.xz" | sha256sum -c -
sudo install -d /opt/personal-site-node
sudo tar -xJf "$work/node.tar.xz" --strip-components=1 -C /opt/personal-site-node
sudo ln -sfn /opt/personal-site-node/bin/node /usr/local/bin/node
python3 -m venv "$HOME/site-tools"
printf 'uv==0.12.7 --hash=sha256:4545e87c7ac64af317d8daffd279e23e93b0e05035662363033d3525923339d2\n' > "$work/uv-requirements.txt"
"$HOME/site-tools/bin/pip" install --disable-pip-version-check --require-hashes -r "$work/uv-requirements.txt"
sudo ln -sfn "$HOME/site-tools/bin/uv" /usr/local/bin/uv
