"""Fill empty paper metadata (title, authors, dates) in result records from the arXiv API.

Contributors only have to type the versioned arXiv identifier; this runs on pull requests.
"""
import json
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import requests

from .schema import ROOT, paper_parts

NS = {"a": "http://www.w3.org/2005/Atom"}


def lookup(identifier, session=None):
    """Return {title, authors, published, updated} for one versioned arXiv id, or None if the API has no entry."""
    paper_parts(identifier)
    response = (session or requests).get("https://export.arxiv.org/api/query", params={"id_list": identifier, "max_results": 1}, timeout=(20, 60),
                                        headers={"User-Agent": "ketworks-metadata/0.1 (https://github.com/ketworks-org/ketworks)"})
    response.raise_for_status()
    feed = ET.fromstring(response.content)
    for entry in feed.findall("a:entry", NS):
        found = entry.findtext("a:id", default="", namespaces=NS).rsplit("/abs/", 1)[-1]
        if found.split("v")[0] != identifier.split("v")[0]:
            continue
        return {"title": " ".join(entry.findtext("a:title", default="", namespaces=NS).split()),
                "authors": ", ".join(a.findtext("a:name", default="", namespaces=NS) for a in entry.findall("a:author", NS)),
                "published": entry.findtext("a:published", default="", namespaces=NS), "updated": entry.findtext("a:updated", default="", namespaces=NS)}
    return None


def fill(root=ROOT, session=None, folders=("results", "proposals"), pause=3.0):
    """Fill empty metadata fields in place; return the list of changed files."""
    changed = []
    for folder in folders:
        for path in sorted((root / "data" / folder).glob("*.json")):
            record = json.loads(path.read_text())
            paper = record["paper"]
            if all(paper.get(key) for key in ("title", "authors", "published", "updated")):
                continue
            meta = lookup(paper["id"], session)
            if meta is None:
                print(f"{path}: arXiv has no entry for {paper['id']}", file=sys.stderr)
                continue
            for key, value in meta.items():
                if not paper.get(key):
                    paper[key] = value
            path.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n")
            changed.append(path)
            time.sleep(pause)
    return changed


if __name__ == "__main__":
    for path in fill(pause=0 if "--no-pause" in sys.argv else 3.0):
        print(path.relative_to(ROOT))
