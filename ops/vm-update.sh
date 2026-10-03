#!/usr/bin/env bash
# Poll ONLY the owner's trusted main branch. Never execute PR/fork code.
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin"
export EXE_API_URL="https://personal-site-status.int.exe.xyz/exec"
export SITE_URL="https://tinng.exe.xyz"
export UV_PYTHON_DOWNLOADS=never
work=/home/exedev/personal-site
state=/srv/tinnguyen/deployed-sha
exec 9>/srv/tinnguyen/update.lock
flock -n 9 || exit 0
if ! test -d "$work/.git"; then
    git clone --quiet --single-branch --branch main --no-tags https://github.com/v36372/personal-site.git "$work"
fi
cd "$work"
# Ignore changed remote URLs; fetch the pinned repository/branch explicitly.
git fetch --quiet --no-tags https://github.com/v36372/personal-site.git refs/heads/main
revision=$(git rev-parse FETCH_HEAD)
if test -f "$state" && test "$(< "$state")" = "$revision"; then exit 0; fi
git checkout --quiet --detach --force "$revision"
uv run --locked python scripts/deploy.py --check
make test
make build
uv run --locked python scripts/deploy.py --local
printf '%s\n' "$revision" > "$state.new"
mv -f "$state.new" "$state"
printf 'Updated trusted main: %s\n' "$revision"
