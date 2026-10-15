"""Build Ketbook and Ketboard from reviewed content, with static LaTeX rendering."""
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import quote

from .schema import ROOT, per_site, validate_tree


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
    result = subprocess.run(["node", str(root / "scripts/render-content.mjs")], input=json.dumps({"articles": articles, "equations": equations}), text=True, capture_output=True, check=True, cwd=root)
    rendered = json.loads(result.stdout)
    source_ref = quote(os.getenv("KETBOOK_SOURCE_REF", "main"), safe="/")
    template = (root / "site/wiki.template.html").read_text()
    for article in rendered["articles"]:
        slug = article["slug"]
        sidebar = "".join(f'<a href="../{page["slug"]}/"' + (' aria-current="page"' if page["slug"] == slug else '') + f'>{html.escape(page["title"])}</a>' for page in index)
        values = {"TITLE": html.escape(article["title"]), "DESCRIPTION": html.escape(article["summary"], quote=True), "SECTION": html.escape(article["section"]), "SIDEBAR": sidebar,
                  "EDIT_URL": f"https://github.com/gcarleo/ketbook/edit/{source_ref}/wiki/{slug}.md", "HISTORY_URL": f"https://github.com/gcarleo/ketbook/commits/{source_ref}/wiki/{slug}.md", "CONTENT": article["html"]}
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
    source_ref = os.getenv("KETBOOK_SOURCE_REF", "main")
    home = destination / "index.html"
    if home.exists():
        home_html = home.read_text().replace("<!--HERO_MATH-->", equations.get("hero", ""))
        for action in ("new", "edit", "blob"):
            home_html = home_html.replace(f"https://github.com/gcarleo/ketbook/{action}/main/", f"https://github.com/gcarleo/ketbook/{action}/{quote(source_ref, safe='/')}/")
            home_html = home_html.replace(f"https://github.com/gcarleo/ketbook/{action}/main?", f"https://github.com/gcarleo/ketbook/{action}/{quote(source_ref, safe='/')}?")
        home.write_text(home_html)
    rows, papers = [], set()
    for path in sorted((root / "data/results").glob("*.json")):
        record = json.loads(path.read_text())
        papers.add(record["paper"]["id"])
        for row in record["results"]:
            energy, error = per_site(row, registry)
            rows.append({**row, "energy_per_site": energy, "uncertainty_per_site": error, "paper": record["paper"], "source_url": record["source_url"]})
    # Proposal files and extraction artifacts never enter the public payload.
    payload = {"source_ref": source_ref, "benchmarks": [{**b, "hamiltonian_html": equations.get(b["id"])} for b in registry.values()], "wiki": wiki, "results": rows, "paper_count": len(papers)}
    (destination / "data.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    (destination / ".nojekyll").touch()
    print(f"Built {destination}: {len(wiki)} wiki pages, {len(rows)} reviewed rows from {len(papers)} papers")
    return payload


if __name__ == "__main__":
    build()
