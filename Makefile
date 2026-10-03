.PHONY: build preview dev test deploy deploy-vm setup-vm
UV ?= uv

build:
	$(UV) run --locked python scripts/build.py

preview:
	$(UV) run --locked python scripts/build.py --include-drafts

# Local-only server with automatic rebuilds; Pages serves generated HTML.
dev:
	$(UV) run --locked python scripts/serve.py

test: preview
	$(UV) run --locked python -m unittest discover -s tests -v
	node --test tests/*.test.mjs
	node --check public/globe.js
	node --check public/theme.js
	node --check public/bookmarks.js
	node --check public/header-art.js
	node --check public/dither-settings.js
	node --check public/vendor/aura-capy-shaders.js
	python3 -m py_compile scripts/build.py scripts/bookmarks.py scripts/serve.py scripts/deploy.py scripts/deploy_pages.py
	bash -n ops/bootstrap.sh ops/runner-bootstrap.sh ops/pages-build.sh

# Native Pages builds GitHub main; uncommitted local files are not uploaded.
deploy: test
	python3 scripts/deploy_pages.py

# Explicit legacy-VM rollback only; no automatic VM deployment.
deploy-vm: test
	python3 scripts/deploy.py

setup-vm: test
	python3 scripts/deploy.py --setup
