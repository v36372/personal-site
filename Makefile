.PHONY: dev test deploy setup

# Local-only preview. Production is served by nginx, never this dev server.
dev:
	python3 -m http.server 3000 --bind 127.0.0.1 --directory public

test:
	python3 -m unittest discover -s tests -v
	python3 -m py_compile scripts/deploy.py
	bash -n ops/bootstrap.sh

deploy: test
	python3 scripts/deploy.py

setup: test
	python3 scripts/deploy.py --setup
