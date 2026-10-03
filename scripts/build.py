#!/usr/bin/env python3
"""An original, small Markdown-to-static-blog builder. No server-side runtime."""
import argparse
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
import math
import os
from pathlib import Path
import re
import shutil
import tempfile
import tomllib
import unicodedata
import xml.etree.ElementTree as ET

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markdown_it import MarkdownIt

if __package__:
    from .bookmarks import KINDS, load_bookmarks
else:
    from bookmarks import KINDS, load_bookmarks

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = os.environ.get("SITE_URL", "https://tinnguyen.exe.xyz").rstrip("/")
ATOM = "http://www.w3.org/2005/Atom"
SITEMAP = "http://www.sitemaps.org/schemas/sitemap/0.9"
MARKDOWN = MarkdownIt("commonmark", {"html": False}).enable("table")


@dataclass(frozen=True)
class Post:
    title: str
    date: date
    slug: str
    description: str
    tags: tuple[str, ...]
    draft: bool
    html: str
    reading_minutes: int

    @property
    def url(self):
        return f"/{self.date:%Y/%m/%d}/{self.slug}/"


def tag_slug(tag):
    normalized = unicodedata.normalize("NFKD", tag).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    if not slug:
        raise ValueError(f"Tag needs a URL-safe name: {tag!r}")
    return slug


def load_post(path):
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not text.startswith("+++\n") or "\n+++\n" not in text[4:]:
        raise ValueError(f"{path}: expected TOML front matter between +++ lines")
    header, body = text[4:].split("\n+++\n", 1)
    metadata = tomllib.loads(header)
    title = metadata.get("title")
    if not isinstance(title, str) or not title.strip():
        raise ValueError(f"{path}: title must be a nonempty string")
    published_date = metadata.get("date")
    if isinstance(published_date, str):
        published_date = date.fromisoformat(published_date)
    if type(published_date) is not date:
        raise ValueError(f"{path}: date must be YYYY-MM-DD")
    slug = metadata.get("slug", re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem))
    if not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError(f"{path}: slug must contain lowercase words separated by hyphens")
    draft = metadata.get("draft", True)
    if not isinstance(draft, bool):
        raise ValueError(f"{path}: draft must be true or false, not a string")
    tags = metadata.get("tags", [])
    if not isinstance(tags, list) or any(not isinstance(tag, str) or not tag.strip() for tag in tags):
        raise ValueError(f"{path}: tags must be a list of nonempty strings")
    tags = tuple(dict.fromkeys(tag.strip() for tag in tags))
    for tag in tags:
        tag_slug(tag)
    description = metadata.get("description")
    if description is None:
        inline = next((token for token in MARKDOWN.parse(body) if token.type == "inline"), None)
        description = "".join(child.content for child in (inline.children or [])
                              if child.type in ("text", "code_inline")) if inline else ""
        description = description[:240].strip()
    if not isinstance(description, str):
        raise ValueError(f"{path}: description must be a string")
    return Post(title.strip(), published_date, slug, description.strip(), tags,
                draft or published_date > date.today(), MARKDOWN.render(body),
                max(1, math.ceil(len(re.findall(r"\b\w+\b", body)) / 220)))


def load_posts(root):
    posts = []
    urls = set()
    tags = {}
    for path in sorted((root / "content/posts").rglob("*.md")):
        if path.is_symlink():
            raise ValueError(f"Post must not be a symlink: {path}")
        post = load_post(path)
        if post.url in urls:
            raise ValueError(f"Duplicate post URL: {post.url}")
        urls.add(post.url)
        for tag in post.tags:
            slug = tag_slug(tag)
            if slug in tags and tags[slug] != tag:
                raise ValueError(f"Tags {tags[slug]!r} and {tag!r} have the same URL")
            tags[slug] = tag
        posts.append(post)
    return sorted(posts, key=lambda post: (post.date, post.slug), reverse=True)


def write_feed(output, posts):
    ET.register_namespace("atom", ATOM)
    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    for key, value in [("title", "Tin Nguyen's writing"), ("link", SITE_URL + "/"),
                       ("description", "Notes and essays from Tin Nguyen."), ("language", "en")]:
        ET.SubElement(channel, key).text = value
    ET.SubElement(channel, f"{{{ATOM}}}link", {"href": SITE_URL + "/feed.xml",
                                             "rel": "self", "type": "application/rss+xml"})
    for post in posts[:20]:
        item = ET.SubElement(channel, "item")
        for key, value in [("title", post.title), ("link", SITE_URL + post.url),
                           ("description", post.description), ("guid", SITE_URL + post.url),
                           ("pubDate", format_datetime(datetime.combine(post.date, time(), timezone.utc), usegmt=True))]:
            ET.SubElement(item, key).text = value
        for tag in post.tags:
            ET.SubElement(item, "category").text = tag
    ET.ElementTree(rss).write(output / "feed.xml", encoding="utf-8", xml_declaration=True)


def build(root=ROOT, output=None, include_drafts=False):
    root = Path(root).resolve()
    output = Path(output or root / "dist").resolve()
    # Never let a typo in --output delete source code or a parent directory.
    if output == root or output in root.parents or any(
        output == root / name or output.is_relative_to(root / name)
        for name in ("public", "content", "templates", "scripts", "tests", ".git", ".venv")
    ):
        raise ValueError("Output must not overwrite the project or its source directories")
    all_posts = load_posts(root)
    all_bookmarks = load_bookmarks(root)
    bookmarks = [item for item in all_bookmarks if include_drafts or item.publish]
    bookmark_tags = sorted({tag for item in bookmarks for tag in item.tags}, key=str.casefold)
    bookmark_kinds = [(kind, label, sum(item.kind == kind for item in bookmarks)) for kind, label in KINDS]
    bookmark_groups = [(month, next(item.month_label for item in bookmarks if item.month == month),
                        [item for item in bookmarks if item.month == month])
                       for month in dict.fromkeys(item.month for item in bookmarks)]
    published = [post for post in all_posts if not post.draft]
    drafts = [post for post in all_posts if post.draft] if include_drafts else []
    selected = [post for post in all_posts if include_drafts or not post.draft]
    tags = sorted({tag for post in selected for tag in post.tags}, key=str.casefold)
    env = Environment(loader=FileSystemLoader(root / "templates"),
                      autoescape=select_autoescape(["html"]), undefined=StrictUndefined,
                      trim_blocks=True, lstrip_blocks=True)
    env.globals["tag_slug"] = tag_slug
    context = {"site_url": SITE_URL, "year": date.today().year, "preview": include_drafts,
               "noindex": False, "has_bookmarks": False,
               "active": "", "published": published, "bookmarks": bookmarks,
               "drafts": drafts, "tags": tags,
               "description": "Tin Nguyen's personal blog. Based in Ho Chi Minh City, Vietnam."}
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".blog-build-", dir=output.parent))
    try:
        for path in (root / "public").rglob("*"):
            if path.is_symlink() or path.name.startswith("."):
                raise ValueError(f"Assets must not include symlinks or hidden files: {path}")
        shutil.copytree(root / "public", staging, dirs_exist_ok=True)

        def render(template, path, **extra):
            target = staging / (path.lstrip("/") if path.endswith(".html") else path.lstrip("/") + "index.html")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(env.get_template(template).render(context | {"path": path} | extra), encoding="utf-8")

        render("home.html", "/", title="Writing", active="writing")
        render("about.html", "/about/", title="About", active="about")
        render("bookmarks.html", "/bookmarks/", title="Bookmarks", active="bookmarks",
               has_bookmarks=True, bookmark_groups=bookmark_groups,
               bookmark_tags=bookmark_tags, bookmark_kinds=bookmark_kinds)
        render("404.html", "/404.html", title="Page not found", noindex=True)
        for index, post in enumerate(selected):
            render("post.html", post.url, title=post.title, description=post.description,
                   active="writing", post=post, noindex=post.draft,
                   older=selected[index + 1] if index + 1 < len(selected) else None,
                   newer=selected[index - 1] if index else None)
        for tag in tags:
            entries = [post for post in selected if tag in post.tags]
            render("tag.html", f"/tags/{tag_slug(tag)}/", title=tag, tag=tag,
                   entries=entries, published_entries=[post for post in entries if not post.draft])
        write_feed(staging, published)
        ET.register_namespace("", SITEMAP)
        sitemap = ET.Element(f"{{{SITEMAP}}}urlset")
        published_tags = sorted({tag for post in published for tag in post.tags})
        urls = ["/", "/about/", "/bookmarks/"] + [post.url for post in published]
        urls += [f"/tags/{tag_slug(tag)}/" for tag in published_tags]
        for path in urls:
            ET.SubElement(ET.SubElement(sitemap, f"{{{SITEMAP}}}url"), f"{{{SITEMAP}}}loc").text = SITE_URL + path
        ET.ElementTree(sitemap).write(staging / "sitemap.xml", encoding="utf-8", xml_declaration=True)
        (staging / "robots.txt").write_text(
            "User-agent: *\n" + ("Disallow: /\n" if include_drafts else "Allow: /\nSitemap: " + SITE_URL + "/sitemap.xml\n"),
            encoding="utf-8")
        if output.exists():
            shutil.rmtree(output)
        staging.rename(output)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--include-drafts", action="store_true", help="Private preview only; drafts stay out of feeds and sitemap.")
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    try:
        posts = build(output=args.output, include_drafts=args.include_drafts)
    except (ValueError, OSError, tomllib.TOMLDecodeError) as error:
        parser.exit(1, str(error) + "\n")
    print(f"Built {args.output}: {len(posts)} entries ({'private preview' if args.include_drafts else 'published only'})")


if __name__ == "__main__":
    main()
