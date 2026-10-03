.PHONY: build preview dev test deploy deploy-vm setup-vm
UV ?= uv

build:
	$(UV) run --locked python scripts/build.py

preview:
	$(UV) run --locked python scripts/build.py --include-drafts

# Local-only server with automatic rebuilds; nginx serves generated HTML.
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
	python3 -m py_compile scripts/build.py scripts/bookmarks.py scripts/serve.py scripts/deploy.py
	bash -n ops/bootstrap.sh ops/vm-update.sh

# Always regenerate reviewed content after tests; never deploy their draft preview.
deploy: test
	$(MAKE) build
	python3 scripts/deploy.py

deploy-vm: deploy

setup-vm: test
	$(MAKE) build
	python3 scripts/deploy.py --setup
