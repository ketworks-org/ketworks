"""Build Ketworks (Ketbook and Ketboard) from reviewed content, with static LaTeX rendering."""
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import quote

from .schema import ROOT, per_site, validate_tree


def nav_html(index, registry, prefix="", current=None):
    """Site-wide left navigation: collapsed sections of wiki pages and Ketboard instances, open only where the reader is."""
    def group(title, href, key, sections, area):
        parts = [f'<div class="nav-group" data-area="{area}"><p class="nav-title"><a href="{href}" data-nav="{key}">{html.escape(title)}</a></p>']
        for name, links, is_open in sections:
            parts.append(f'<details class="nav-sub"{" open" if is_open else ""}><summary>{html.escape(name)}</summary>{"".join(links)}</details>')
        return "".join(parts) + "</div>"
    current_section = next((page["section"] for page in index if page["slug"] == current), None)
    wiki_sections = []
    for section in dict.fromkeys(page["section"] for page in index):
        links = [f'<a href="{prefix}wiki/{page["slug"]}/"' + (' aria-current="page"' if page["slug"] == current else "") + f'>{html.escape(page["title"])}</a>' for page in index if page["section"] == section]
        wiki_sections.append((section, links, section == current_section))
    board_sections = []
    for family in dict.fromkeys(b["family"] for b in registry.values()):
        links = [f'<a href="{prefix}#benchmarks?system={quote(b["id"])}" data-instance="{html.escape(b["id"])}">{html.escape(b.get("instance_label") or b["id"])}</a>' for b in registry.values() if b["family"] == family]
        board_sections.append((family, links, False))
    contribute = (f'<div class="nav-group" data-area="contribute"><p class="nav-title"><a href="{prefix}#contribute" data-nav="contribute">Contribute</a></p>'
                  f'<a href="{prefix}#submit" data-nav="submit">Submit a result</a>'
                  '<a href="https://github.com/ketworks-org/ketworks/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contribution guide ↗</a>'
                  '<a href="https://github.com/ketworks-org/ketworks" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>')
    return group("Ketbook", prefix + "#wiki", "wiki", wiki_sections, "wiki") + group("Ketboard", prefix + "#benchmarks", "benchmarks", board_sections, "board") + contribute


def render_content(root, destination, registry):
    if not (root / "wiki/index.json").exists():
        return [], {}
    index = json.loads((root / "wiki/index.json").read_text())
    seen = set()
    for page in index:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", page["slug"]) or page["slug"] in seen:
            raise ValueError("Wiki slugs must be unique, lowercase, and path-safe")
        seen.add(page["slug"])
    articles = [{**page, "markdown": (root / "wiki" / (page["slug"] + ".md")).read_text()} for page in index]
    equations = {"hero": r"E_\theta = \frac{\langle\Psi_\theta|H|\Psi_\theta\rangle}{\langle\Psi_\theta|\Psi_\theta\rangle} \geq E_0"}
    equations.update({key: value["hamiltonian_latex"] for key, value in registry.items() if "hamiltonian_latex" in value})
    equations.update({key + ":parameters": value["parameters_latex"] for key, value in registry.items() if "parameters_latex" in value})
    result = subprocess.run(["node", str(root / "scripts/render-content.mjs")], input=json.dumps({"articles": articles, "equations": equations}), text=True, capture_output=True, check=True, cwd=root)
    rendered = json.loads(result.stdout)
    source_ref = quote(os.getenv("KETWORKS_SOURCE_REF", "main"), safe="/")
    template = (root / "site/wiki.template.html").read_text()
    sections = list(dict.fromkeys(page["section"] for page in index))
    for article in rendered["articles"]:
        slug = article["slug"]
        toc = "".join(f'<a href="#{h["id"]}" class="toc-{h["level"]}">{html.escape(h["text"])}</a>' for h in article["headings"] if h["level"] == 2)
        status = article.get("status", "draft")
        if status not in ("draft", "reviewed"):
            raise ValueError(f"{slug}: status must be draft or reviewed")
        status_html = '<span class="status status-reviewed">Reviewed</span>' if status == "reviewed" else '<span class="status status-draft">Draft · not yet reviewed by a curator</span>'
        values = {"TITLE": html.escape(article["title"]), "DESCRIPTION": html.escape(article["summary"], quote=True), "SECTION": html.escape(article["section"]), "NAV": nav_html(index, registry, "../../", slug), "TOC": toc, "STATUS": status_html,
                  "SLUG": slug, "EDIT_URL": f"https://github.com/ketworks-org/ketworks/edit/{source_ref}/wiki/{slug}.md", "HISTORY_URL": f"https://github.com/ketworks-org/ketworks/commits/{source_ref}/wiki/{slug}.md", "CONTENT": article["html"]}
        page_html = re.sub(r"\{\{([A-Z_]+)\}\}", lambda match: values[match[1]], template)
        page_dir = destination / "wiki" / slug
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(page_html)
    vendor = destination / "vendor/katex"
    vendor.mkdir(parents=True, exist_ok=True)
    package = root / "node_modules/katex"
    shutil.copy2(package / "dist/katex.min.css", vendor / "katex.min.css")
    shutil.copy2(package / "LICENSE", vendor / "LICENSE")
    shutil.copytree(package / "dist/fonts", vendor / "fonts", dirs_exist_ok=True)
    return index, rendered["equations"]


def build(root=ROOT, destination=None):
    registry = validate_tree(root)
    destination = destination or root / "dist"
    # This directory is generated output; clean it so deleted wiki pages cannot survive.
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True, exist_ok=True)
    for path in (root / "site").iterdir():
        if path.is_file() and not path.name.endswith(".template.html"):
            shutil.copy2(path, destination / path.name)
    wiki, equations = render_content(root, destination, registry)
    slugs = {page["slug"] for page in wiki}
    for benchmark in registry.values():
        if wiki and benchmark.get("wiki") and benchmark["wiki"] not in slugs:
            raise ValueError(f"{benchmark['id']}: wiki page {benchmark['wiki']!r} does not exist")
    source_ref = os.getenv("KETWORKS_SOURCE_REF", "main")
    home = destination / "index.html"
    if home.exists():
        home_html = home.read_text().replace("<!--HERO_MATH-->", equations.get("hero", "")).replace("<!--NAV-->", nav_html(registry=registry, index=wiki))
        for action in ("new", "edit", "blob"):
            home_html = home_html.replace(f"https://github.com/ketworks-org/ketworks/{action}/main/", f"https://github.com/ketworks-org/ketworks/{action}/{quote(source_ref, safe='/')}/")
            home_html = home_html.replace(f"https://github.com/ketworks-org/ketworks/{action}/main?", f"https://github.com/ketworks-org/ketworks/{action}/{quote(source_ref, safe='/')}?")
        home.write_text(home_html)
    rows, papers, records = [], set(), {}
    for path in sorted((root / "data/results").glob("*.json")):
        record = json.loads(path.read_text())
        papers.add(record["paper"]["id"])
        records[path.stem] = {key: record[key] for key in ("schema_version", "paper", "source_url", "source_sha256", "extraction_model", "issues")}
        for row in record["results"]:
            energy, error = per_site(row, registry)
            rows.append({**row, "energy_per_site": energy, "uncertainty_per_site": error, "paper": record["paper"], "source_url": record["source_url"]})
    # Proposal files and extraction artifacts never enter the public payload.
    payload = {"source_ref": source_ref, "benchmarks": [{**b, "hamiltonian_html": equations.get(b["id"]), "parameters_html": equations.get(b["id"] + ":parameters")} for b in registry.values()], "wiki": wiki, "results": rows, "papers": records, "paper_count": len(papers)}
    (destination / "data.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    (destination / ".nojekyll").touch()
    print(f"Built {destination}: {len(wiki)} wiki pages, {len(rows)} reviewed rows from {len(papers)} papers")
    return payload


if __name__ == "__main__":
    build()
