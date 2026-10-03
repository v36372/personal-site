"""Validated saved links. Private by default; no remote fetching or tracking."""
from dataclasses import dataclass
from datetime import date
import json
from pathlib import Path
from urllib.parse import urlsplit

KINDS = (("link", "Links"), ("article", "Articles"), ("video", "Videos"), ("paper", "Papers"))


@dataclass(frozen=True)
class Bookmark:
    title: str
    url: str
    kind: str
    saved: date | None
    tags: tuple[str, ...]
    note: str
    publish: bool

    @property
    def domain(self):
        return urlsplit(self.url).hostname.removeprefix("www.")

    @property
    def month(self):
        return self.saved.strftime("%Y-%m") if self.saved else "undated"

    @property
    def month_label(self):
        return self.saved.strftime("%B %Y") if self.saved else "Date not recorded"


def parse_bookmark(data, index=0):
    prefix = f"Bookmark {index + 1}"
    if not isinstance(data, dict):
        raise ValueError(f"{prefix}: expected an object")
    url = data.get("url")
    if not isinstance(url, str) or not url.strip():
        raise ValueError(f"{prefix}: url is required")
    url = url.strip()
    try:
        parsed = urlsplit(url)
        _ = parsed.port  # Validate an explicitly supplied port.
    except ValueError as error:
        raise ValueError(f"{prefix}: invalid URL") from error
    if (parsed.scheme not in ("https", "http") or not parsed.hostname
            or parsed.username is not None or parsed.password is not None
            or any(character.isspace() or ord(character) < 32 for character in url)):
        raise ValueError(f"{prefix}: use an HTTP(S) URL without embedded credentials")
    title = data.get("title", url)
    note = data.get("note", "")
    if not isinstance(title, str) or not title.strip() or not isinstance(note, str):
        raise ValueError(f"{prefix}: title and note must be text")
    kind = data.get("kind", "link")
    if not isinstance(kind, str) or kind not in dict(KINDS):
        raise ValueError(f"{prefix}: kind must be link, article, video, or paper")
    saved = data.get("saved")
    if saved is not None:
        if not isinstance(saved, str):
            raise ValueError(f"{prefix}: saved must be a YYYY-MM-DD string or null")
        try:
            parsed_date = date.fromisoformat(saved)
            if parsed_date.isoformat() != saved:
                raise ValueError("Use an ISO calendar date")
            saved = parsed_date
        except ValueError as error:
            raise ValueError(f"{prefix}: saved must be a valid YYYY-MM-DD date") from error
    tags = data.get("tags", [])
    if not isinstance(tags, list) or any(not isinstance(tag, str) or not tag.strip() for tag in tags):
        raise ValueError(f"{prefix}: tags must be a list of nonempty strings")
    publish = data.get("publish", False)
    if not isinstance(publish, bool):
        raise ValueError(f"{prefix}: publish must be true or false")
    return Bookmark(title.strip(), url, kind, saved,
                    tuple(dict.fromkeys(tag.strip() for tag in tags)), note.strip(), publish)


def load_bookmarks(root):
    path = Path(root) / "content/bookmarks.json"
    if not path.exists():
        return []
    if path.is_symlink():
        raise ValueError("Bookmark collection must not be a symlink")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("content/bookmarks.json must contain an array")
    bookmarks = [parse_bookmark(item, index) for index, item in enumerate(data)]
    urls = set()
    for bookmark in bookmarks:
        if bookmark.url in urls:
            raise ValueError("Duplicate bookmark URL; merge its tags/notes into one entry")
        urls.add(bookmark.url)
    return sorted(bookmarks, key=lambda item: (item.saved or date.min, item.title.casefold()), reverse=True)
