.PHONY: build preview dev test deploy setup

build:
	uv run --locked python scripts/build.py

preview:
	uv run --locked python scripts/build.py --include-drafts

# Local-only server with automatic rebuilds; the VM serves generated HTML.
dev:
	uv run --locked python scripts/serve.py

test: preview
	uv run --locked python -m unittest discover -s tests -v
	node --test tests/globe.test.mjs
	node --check public/globe.js
	python3 -m py_compile scripts/build.py scripts/serve.py scripts/deploy.py
	bash -n ops/bootstrap.sh

deploy: test
	python3 scripts/deploy.py

setup: test
	python3 scripts/deploy.py --setup
