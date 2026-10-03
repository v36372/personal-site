#!/usr/bin/env python3
"""Local-only preview server, rebuilding when Markdown, templates or assets change."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import re
import threading

from build import ROOT, build


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        policy = re.search(r'Content-Security-Policy "([^"\n]+)"',
                           (ROOT / 'ops/nginx.conf').read_text()).group(1)
        self.send_header('Content-Security-Policy', policy)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / 'dist/404.html').is_file():
            content = (ROOT / 'dist/404.html').read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(content)
        else:
            super().send_error(code, message, explain)


def signature():
    return tuple((str(path), path.stat().st_mtime_ns, path.stat().st_size)
                 for name in ('content', 'templates', 'public')
                 for path in sorted((ROOT / name).rglob('*')) if path.is_file())


def watch(stop):
    previous = signature()
    while not stop.wait(0.75):
        try:
            current = signature()
        except OSError:
            # Editors often replace files atomically; retry a transient rename.
            continue
        if current != previous:
            previous = current
            try:
                build(include_drafts=True)
                print('Rebuilt private preview; refresh your browser.', flush=True)
            except Exception as error:
                print(f'Build failed; keeping last successful preview: {error}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=3000)
    args = parser.parse_args()
    build(include_drafts=True)
    stop = threading.Event()
    watcher = threading.Thread(target=watch, args=(stop,), daemon=True)
    watcher.start()
    server = ThreadingHTTPServer(('127.0.0.1', args.port),
                                partial(PreviewHandler, directory=str(ROOT / 'dist')))
    print(f'Local private preview: http://127.0.0.1:{args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        server.server_close()


if __name__ == '__main__':
    main()
