"""Checks against the base commit of a pull request.

An older paper version may not overwrite a newer merged one, and every entry added to
data/results must carry an error bar. Entries already on main are left as they are.
"""
import json
from pathlib import Path
import re
import subprocess
import sys
from .schema import ROOT, paper_parts, row_key


def check(base, root=ROOT):
    if not re.fullmatch(r"[0-9a-f]{40}", base):
        raise ValueError("Expected a full base commit SHA")
    for folder in ("results", "proposals"):
        for path in (root / "data" / folder).glob("*.json"):
            result = subprocess.run(["git", "show", f"{base}:{path.relative_to(root)}"], cwd=root, text=True, capture_output=True)
            current = json.loads(path.read_text())
            previous = json.loads(result.stdout) if result.returncode == 0 else None
            if previous and paper_parts(current["paper"]["id"])[1] < paper_parts(previous["paper"]["id"])[1]:
                raise ValueError(f"Paper version regressed: {path.name}")
            if folder == "results":
                existing = {row_key(row) for row in (previous or {}).get("results", [])}
                for row in current["results"]:
                    if row_key(row) not in existing and row["uncertainty"] is None:
                        raise ValueError(f"{path.name}: new entry '{row['method']} / {row['variant']}' has no error bar; entries need the uncertainty printed in the paper")


if __name__ == "__main__":
    check(sys.argv[1])
