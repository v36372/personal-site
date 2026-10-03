#!/usr/bin/env bash
# Dedicated Ubuntu/exeslim x64 runner only. Never run this on the website VM.
# No registration token is accepted in arguments or written to this repository.
set -euo pipefail

sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends   git python3 python3-venv make curl ca-certificates xz-utils tar

# Pin and verify the system Node binary used by our dependency-free JS tests.
NODE_VERSION=24.20.0
NODE_SHA256=2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
curl -fsSL --retry 3 "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" -o "$work/node.tar.xz"
printf '%s  %s\n' "$NODE_SHA256" "$work/node.tar.xz" | sha256sum -c -
sudo install -d /opt/personal-site-node
sudo tar -xJf "$work/node.tar.xz" --strip-components=1 -C /opt/personal-site-node
sudo ln -sfn /opt/personal-site-node/bin/node /usr/local/bin/node

# Isolate the uv tool installation from Ubuntu's system Python.
python3 -m venv "$HOME/ci-tools"
printf 'uv==0.12.7 --hash=sha256:4545e87c7ac64af317d8daffd279e23e93b0e05035662363033d3525923339d2\n' > "$work/uv-requirements.txt"
"$HOME/ci-tools/bin/pip" install --disable-pip-version-check --require-hashes -r "$work/uv-requirements.txt"
sudo ln -sfn "$HOME/ci-tools/bin/uv" /usr/local/bin/uv

# Verify the official GitHub runner release before extracting it.
RUNNER_VERSION=2.337.0
RUNNER_SHA256=70920811a4f8ad4328818682bca5c6469c1c942fab52448868071d0063816613
install -d -m 0700 "$HOME/actions-runner"
curl -fsSL --retry 3 "https://github.com/actions/runner/releases/download/v$RUNNER_VERSION/actions-runner-linux-x64-$RUNNER_VERSION.tar.gz" -o "$work/runner.tar.gz"
printf '%s  %s\n' "$RUNNER_SHA256" "$work/runner.tar.gz" | sha256sum -c -
tar -xzf "$work/runner.tar.gz" -C "$HOME/actions-runner"
cd "$HOME/actions-runner"
sudo ./bin/installdependencies.sh
python3 --version
node --version
uv --version
printf 'Runner prerequisites installed. Register through environment input, never --token argv.\n'
