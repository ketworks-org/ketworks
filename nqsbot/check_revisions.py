"""Prevent an older paper PR overwriting a newer merged paper version."""
import json
from pathlib import Path
import re
import subprocess
import sys
from .schema import ROOT, paper_parts


def check(base, root=ROOT):
    if not re.fullmatch(r"[0-9a-f]{40}", base):
        raise ValueError("Expected a full base commit SHA")
    for folder in ("results", "proposals"):
        for path in (root / "data" / folder).glob("*.json"):
            result = subprocess.run(["git", "show", f"{base}:{path.relative_to(root)}"], cwd=root, text=True, capture_output=True)
            if result.returncode:
                continue
            previous, current = json.loads(result.stdout), json.loads(path.read_text())
            if paper_parts(current["paper"]["id"])[1] < paper_parts(previous["paper"]["id"])[1]:
                raise ValueError(f"Paper version regressed: {path.name}")


if __name__ == "__main__":
    check(sys.argv[1])
