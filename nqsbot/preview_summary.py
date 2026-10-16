"""Describe what a pull request changes, with links into its preview.

Usage: python -m nqsbot.preview_summary BASE_SHA > summary.md

The output is Markdown in which {PREVIEW} stands for the preview's address; the deploy workflow
fills it in. It lists new or changed instances, the entries added, changed or removed on each
instance, and the pages of Ketbook that changed, each linked to where it appears in the preview.
"""
import json
import subprocess
import sys
from pathlib import Path

from .schema import ROOT, row_key


def git_show(root, ref, path):
    result = subprocess.run(["git", "show", f"{ref}:{path}"], cwd=root, capture_output=True, text=True)
    return result.stdout if result.returncode == 0 else None


def changed_paths(root, base):
    out = subprocess.run(["git", "diff", "--name-only", f"{base}...HEAD"], cwd=root, capture_output=True, text=True, check=True).stdout
    return [line for line in out.splitlines() if line]


def describe(paths, before, after):
    """paths: changed files; before/after: path -> file text or None (absent)."""
    load = lambda text: json.loads(text) if text else None
    lines = []
    registry = {b["id"]: b for b in (load(after.get("data/benchmarks.json")) or load(before.get("data/benchmarks.json")) or [])}
    label = lambda bid: (registry.get(bid, {}).get("family", "") + " · " + registry.get(bid, {}).get("instance_label", bid)).strip(" ·")
    link = lambda bid: f"[{label(bid)}]({{PREVIEW}}/#benchmarks?system={bid})"
    if "data/benchmarks.json" in paths:
        old = {b["id"]: b for b in load(before.get("data/benchmarks.json")) or []}
        new = {b["id"]: b for b in load(after.get("data/benchmarks.json")) or []}
        added = [bid for bid in new if bid not in old]
        edited = [bid for bid in new if bid in old and new[bid] != old[bid]]
        removed = [bid for bid in old if bid not in new]
        if added or edited or removed:
            lines.append("**Instances**")
            lines += [f"- new: {link(bid)}" for bid in added]
            # Group instances by the fields that changed, so a field added to every instance is one line.
            groups = {}
            for bid in edited:
                fields = sorted(k for k in set(old[bid]) | set(new[bid]) if old[bid].get(k) != new[bid].get(k))
                groups.setdefault(tuple(fields), []).append(bid)
            for fields, bids in groups.items():
                names = ", ".join(f"`{f}`" for f in fields)
                if len(bids) > 3:
                    lines.append(f"- {names} changed on {len(bids)} instances")
                else:
                    lines += [f"- {names} changed: {link(bid)}" for bid in bids]
            lines += [f"- removed: `{bid}`" for bid in removed]
            lines.append("")
    entries = {}
    for path in paths:
        if not (path.startswith("data/results/") and path.endswith(".json")):
            continue
        old = {row_key(r): r for r in (load(before.get(path)) or {}).get("results", [])}
        record = load(after.get(path)) or {}
        new = {row_key(r): r for r in record.get("results", [])}
        paper = (record.get("paper") or load(before.get(path)).get("paper"))["id"]
        for key, row in new.items():
            kind = "added" if key not in old else ("changed" if old[key] != row else None)
            if kind:
                entries.setdefault(row["benchmark_id"], []).append((kind, paper))
        for key, row in old.items():
            if key not in new:
                entries.setdefault(row["benchmark_id"], []).append(("removed", paper))
    if entries:
        lines.append("**Ketboard entries**")
        for bid, items in entries.items():
            counts = {kind: sum(1 for k, _ in items if k == kind) for kind in ("added", "changed", "removed")}
            text = ", ".join(f"{n} {kind}" for kind, n in counts.items() if n)
            papers = ", ".join(sorted({f"arXiv:{p}" for _, p in items}))
            lines.append(f"- {link(bid)}: {text} ({papers})")
        lines.append("")
    pages = [p for p in paths if p.startswith("wiki/") and p.endswith(".md")]
    if pages:
        lines.append("**Ketbook pages**")
        for path in pages:
            slug = Path(path).stem
            lines.append(f"- [{slug}]({{PREVIEW}}/wiki/{slug}/)" if after.get(path) is not None else f"- removed: `{path}`")
        lines.append("")
    standalone = [p for p in paths if p.startswith("pages/") and p.endswith(".md")]
    if standalone:
        lines.append("**Other pages**")
        lines += [f"- [{Path(p).stem}]({{PREVIEW}}/{Path(p).stem}/)" if after.get(p) is not None else f"- removed: `{p}`" for p in standalone]
        lines.append("")
    other = [p for p in paths if p.startswith(("site/", "nqsbot/build.py", "scripts/render-content.mjs"))]
    if other:
        lines.append(f"**Site code** changed in {len(other)} file(s); start from the [landing page]({{PREVIEW}}/).")
        lines.append("")
    return "\n".join(lines).strip() or "No pages, instances or entries change; the preview is the current site with this pull request applied."


def main(base, root=ROOT):
    paths = changed_paths(root, base)
    # Only data files and pages are read; other changes (images, code) are listed by path alone.
    read = [p for p in paths if p.startswith(("data/", "wiki/", "pages/")) and p.endswith((".json", ".md"))] + ["data/benchmarks.json"]
    before = {p: git_show(root, base, p) for p in read}
    after = {p: (root / p).read_text() if (root / p).exists() else None for p in read}
    print(describe(paths, before, after))


if __name__ == "__main__":
    main(sys.argv[1])
