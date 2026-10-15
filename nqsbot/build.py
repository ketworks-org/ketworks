"""Build a portable static site using only curated repository data."""
import json
import shutil
from pathlib import Path
from .schema import ROOT, per_site, validate_tree


def build(root=ROOT, destination=None):
    registry = validate_tree(root)
    destination = destination or root / "dist"
    destination.mkdir(parents=True, exist_ok=True)
    for path in (root / "site").iterdir():
        if path.is_file():
            shutil.copy2(path, destination / path.name)
    rows = []
    papers = set()
    for path in sorted((root / "data/results").glob("*.json")):
        record = json.loads(path.read_text())
        papers.add(record["paper"]["id"])
        for row in record["results"]:
            energy, error = per_site(row, registry)
            rows.append({**row, "energy_per_site": energy, "uncertainty_per_site": error,
                         "paper": record["paper"], "source_url": record["source_url"]})
    # Proposal files and run artifacts are deliberately absent from the public payload.
    payload = {"benchmarks": list(registry.values()), "results": rows, "paper_count": len(papers)}
    (destination / "data.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    (destination / ".nojekyll").touch()
    print(f"Built {destination}: {len(rows)} reviewed rows from {len(papers)} papers")
    return payload


if __name__ == "__main__":
    build()
