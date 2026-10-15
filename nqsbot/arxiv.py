"""Polite metadata discovery and version-pinned source retrieval."""
from datetime import datetime, timedelta, timezone
from io import BytesIO
import hashlib
import time
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup
from pypdf import PdfReader
import requests

from .schema import paper_parts


class Arxiv:
    def __init__(self, contact, session=None):
        if not contact or "@" not in contact:
            raise ValueError("Set ARXIV_CONTACT to a maintainer email")
        self.session = session or requests.Session()
        self.headers = {"User-Agent": f"nqs-resources/0.1 (research literature index; mailto:{contact})"}
        self.last_request = 0.0

    def get(self, url, params=None):
        if urlparse(url).hostname not in ("arxiv.org", "export.arxiv.org"):
            raise ValueError("Only arXiv source URLs are fetched")
        for attempt in range(3):
            time.sleep(max(0, 3.1 - (time.monotonic() - self.last_request)))
            self.last_request = time.monotonic()
            response = self.session.get(url, params=params, headers=self.headers, timeout=(20, 90), stream=True)
            if response.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                response.close()
                time.sleep(5 * (attempt + 1))
                continue
            try:
                response.raise_for_status()
                chunks, size = [], 0
                for chunk in response.iter_content(65536):
                    size += len(chunk)
                    if size > 30_000_000:
                        raise ValueError("Source exceeds 30 MB retrieval limit")
                    chunks.append(chunk)
                return b"".join(chunks)
            finally:
                response.close()
        raise RuntimeError("arXiv retries exhausted")

    def discover(self, config):
        cutoff = datetime.now(timezone.utc) - timedelta(days=config["lookback_days"])
        papers = {}
        for page in range(config["max_pages"]):
            raw = self.get("https://export.arxiv.org/api/query", {
                "search_query": config["query"], "sortBy": "lastUpdatedDate", "sortOrder": "descending",
                "start": page * config["page_size"], "max_results": config["page_size"],
            })
            ns = {"a": "http://www.w3.org/2005/Atom", "o": "http://a9.com/-/spec/opensearch/1.1/"}
            feed = ET.fromstring(raw)
            entries = feed.findall("a:entry", ns)
            if not entries:
                return list(papers.values())
            for entry in entries:
                get = lambda name: (entry.findtext(f"a:{name}", default="", namespaces=ns)).strip()
                identifier = get("id").rsplit("/", 1)[-1]
                if identifier == "errors":
                    raise RuntimeError("arXiv returned a feed error")
                paper_parts(identifier)
                if datetime.fromisoformat(get("updated").replace("Z", "+00:00")) < cutoff:
                    return list(papers.values())
                paper = {"id": identifier, "title": " ".join(get("title").split()),
                         "authors": ", ".join(a.findtext("a:name", default="", namespaces=ns) for a in entry.findall("a:author", ns)),
                         "published": get("published"), "updated": get("updated")}
                papers[identifier] = paper
            if len(entries) < config["page_size"]:
                return list(papers.values())
        raise RuntimeError("Discovery pagination cap reached; increase max_pages to avoid silently missing papers")

    def source(self, identifier):
        paper_parts(identifier)
        url = f"https://arxiv.org/html/{identifier}"
        try:
            raw = self.get(url)
            soup = BeautifulSoup(raw, "html.parser")
            article = soup.find("article")
            if article is None:
                raise ValueError("No arXiv article body")
            for unwanted in article.select("script, style, nav"):
                unwanted.decompose()
            for math in article.find_all("math"):
                if math.get("alttext"):
                    math.replace_with(" " + math["alttext"] + " ")
            text = article.get_text(" ", strip=True)
            if len(text) < 500:
                raise ValueError("Empty article")
        except (requests.HTTPError, ValueError):
            url = f"https://arxiv.org/pdf/{identifier}"
            raw = self.get(url)
            reader = PdfReader(BytesIO(raw))
            text = "\n\n".join(f"[PDF page {i+1}]\n{page.extract_text() or ''}" for i, page in enumerate(reader.pages))
            if len(text) < 500:
                raise ValueError("PDF has insufficient extractable text; needs manual review")
        if len(text) > 350_000:
            raise ValueError("Paper exceeds input limit; do not silently truncate scientific context")
        return {"url": url, "sha256": hashlib.sha256(raw).hexdigest(), "text": text}
