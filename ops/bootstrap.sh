#!/usr/bin/env bash
set -euo pipefail

# exeslim intentionally has no web server or development toolchain.
sudo apt-get update
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nginx-light
sudo install -d -m 0755 -o exedev -g exedev /srv/tinnguyen /srv/tinnguyen/releases
sudo rm -f /etc/nginx/sites-enabled/default
